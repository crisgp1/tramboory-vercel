import { NextRequest, NextResponse } from "next/server";
import { validateSupplierAccess } from "@/lib/supplier-auth";
import dbConnect from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/supplier/profile
 * 
 * Fetches the profile data for the authenticated supplier
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const connection = await dbConnect();
    if (!connection || !connection.connection || !connection.connection.db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    }
    
    const db = connection.connection.db;
    
    // Validate supplier access
    const supplier = await validateSupplierAccess(request);
    if (!supplier) {
      return NextResponse.json({ error: "No tiene permisos para acceder a esta información" }, { status: 403 });
    }

    // Enhance supplier data with additional information
    const enhancedSupplier = await enhanceSupplierData(db, supplier);

    return NextResponse.json(enhancedSupplier);
  } catch (error) {
    console.error("Error fetching supplier profile:", error);
    return NextResponse.json({ error: "Error al obtener el perfil del proveedor" }, { status: 500 });
  }
}

/**
 * PUT /api/supplier/profile
 * 
 * Updates the profile data for the authenticated supplier
 */
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const connection = await dbConnect();
    if (!connection || !connection.connection || !connection.connection.db) {
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 500 });
    }
    
    const db = connection.connection.db;
    
    // Validate supplier access
    const supplier = await validateSupplierAccess(request);
    if (!supplier) {
      return NextResponse.json({ error: "No tiene permisos para acceder a esta información" }, { status: 403 });
    }

    // Get the update data from the request
    const updateData = await request.json();

    // Validate and sanitize the update data
    const sanitizedData = sanitizeUpdateData(updateData);
    if (!sanitizedData) {
      return NextResponse.json({ error: "Datos de actualización inválidos" }, { status: 400 });
    }

    // Update the supplier in the database
    const result = await db.collection("suppliers").updateOne(
      { _id: new ObjectId(supplier._id) },
      { $set: sanitizedData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "No se pudo actualizar el perfil del proveedor" }, { status: 500 });
    }

    // Get the updated supplier data
    const updatedSupplier = await db.collection("suppliers").findOne({ _id: new ObjectId(supplier._id) });
    const enhancedSupplier = await enhanceSupplierData(db, updatedSupplier);

    return NextResponse.json(enhancedSupplier);
  } catch (error) {
    console.error("Error updating supplier profile:", error);
    return NextResponse.json({ error: "Error al actualizar el perfil del proveedor" }, { status: 500 });
  }
}

/**
 * Enhances supplier data with additional information from related collections
 */
async function enhanceSupplierData(db: any, supplier: any) {
  if (!supplier) return null;

  // Clone the supplier object to avoid modifying the original
  const enhancedSupplier = { ...supplier };
  
  try {
    // Add order statistics
    const orderStats = await db.collection("purchase_orders").aggregate([
      { $match: { supplierId: supplier._id.toString() } },
      { $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Add product statistics
    const productStats = await db.collection("products").aggregate([
      { $match: { "suppliers.supplierId": supplier._id.toString() } },
      { $group: {
          _id: "$isActive",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Calculate performance metrics
    const performanceMetrics = {
      qualityIssues: 0,
      returnRate: 0,
      responseTime: 0,
      avgProcessingDays: 0
    };
    
    // Get quality issues count
    const qualityIssues = await db.collection("quality_reports").countDocuments({
      supplierId: supplier._id.toString(),
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    });
    
    if (qualityIssues !== undefined) {
      performanceMetrics.qualityIssues = qualityIssues;
    }
    
    // Calculate order statistics
    const orderHistory = {
      totalOrders: 0,
      completedOnTime: 0,
      completedLate: 0,
      cancelled: 0,
      averageOrderValue: 0
    };
    
    const completedOrders = await db.collection("purchase_orders").find({
      supplierId: supplier._id.toString(),
      status: "RECEIVED"
    }).toArray();
    
    if (completedOrders && completedOrders.length > 0) {
      orderHistory.totalOrders = completedOrders.length;
      
      let totalValue = 0;
      
      for (const order of completedOrders) {
        totalValue += order.total || 0;
        
        if (order.actualDeliveryDate && order.expectedDeliveryDate) {
          const actualDate = new Date(order.actualDeliveryDate);
          const expectedDate = new Date(order.expectedDeliveryDate);
          
          if (actualDate <= expectedDate) {
            orderHistory.completedOnTime++;
          } else {
            orderHistory.completedLate++;
          }
        }
      }
      
      if (orderHistory.totalOrders > 0) {
        orderHistory.averageOrderValue = totalValue / orderHistory.totalOrders;
      }
    }
    
    const cancelledOrders = await db.collection("purchase_orders").countDocuments({
      supplierId: supplier._id.toString(),
      status: "CANCELLED"
    });
    
    if (cancelledOrders !== undefined) {
      orderHistory.cancelled = cancelledOrders;
      orderHistory.totalOrders += cancelledOrders;
    }
    
    // Calculate return rate
    const totalProductsDelivered = await db.collection("purchase_order_items").aggregate([
      { $match: { supplierId: supplier._id.toString() } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]).toArray();
    
    const totalProductsReturned = await db.collection("product_returns").aggregate([
      { $match: { supplierId: supplier._id.toString() } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]).toArray();
    
    if (totalProductsDelivered.length > 0 && totalProductsReturned.length > 0) {
      const delivered = totalProductsDelivered[0].total || 0;
      const returned = totalProductsReturned[0].total || 0;
      
      if (delivered > 0) {
        performanceMetrics.returnRate = Math.round((returned / delivered) * 100);
      }
    }
    
    // Assemble the final object
    enhancedSupplier.performance = {
      metrics: performanceMetrics,
      orderHistory: orderHistory,
      rating: supplier.rating || {
        overall: 4.5,
        quality: 4.3,
        price: 4.7,
        delivery: 4.2,
        service: 4.8,
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Ensure the supplier has all required fields
    if (!enhancedSupplier.businessTerms) {
      enhancedSupplier.businessTerms = {
        paymentTerms: {
          method: "transfer",
          creditDays: 30,
          currency: "MXN"
        },
        deliveryInfo: {
          averageLeadTimeDays: 5,
          shippingTerms: "DAP",
          internationalShipping: false
        },
        certifications: []
      };
    }
    
    return enhancedSupplier;
  } catch (error) {
    console.error("Error enhancing supplier data:", error);
    return supplier; // Return original supplier data if enhancement fails
  }
}

/**
 * Validates and sanitizes supplier update data
 * Only allows specific fields to be updated for security
 */
function sanitizeUpdateData(data: any) {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  const allowedFields = {
    // Basic info
    name: true,
    businessName: true,
    taxId: true,
    description: true,
    
    // Contact info
    contactInfo: {
      email: true,
      phone: true,
      website: true,
      address: {
        street: true,
        city: true,
        state: true,
        postalCode: true,
        country: true
      }
    },
    
    // Contacts array
    contacts: true,
    
    // Business terms
    businessTerms: {
      paymentTerms: {
        method: true,
        creditDays: true,
        bankAccount: true,
        currency: true
      },
      deliveryInfo: {
        averageLeadTimeDays: true,
        minimumOrderValue: true,
        shippingTerms: true,
        internationalShipping: true
      },
      certifications: true
    }
  };
  
  // Function to filter object recursively based on allowed fields
  const filterObject = (obj: any, allowedStructure: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    // Handle arrays separately
    if (Array.isArray(obj)) {
      // For contacts array, validate each contact object
      if (allowedStructure === true) {
        if (obj[0] && typeof obj[0] === 'object') {
          // Special case for contacts array
          if (obj[0].name !== undefined) {
            return obj.map((item: any) => ({
              name: item.name || '',
              position: item.position || '',
              email: item.email || '',
              phone: item.phone || '',
              isPrimary: !!item.isPrimary
            }));
          }
          // Special case for certifications array
          if (typeof obj[0] === 'string') {
            return obj.filter((item: any) => typeof item === 'string');
          }
        }
        return obj;
      }
      return obj;
    }
    
    const result: any = {};
    
    for (const key in allowedStructure) {
      if (obj[key] !== undefined) {
        if (allowedStructure[key] === true) {
          result[key] = obj[key];
        } else if (typeof allowedStructure[key] === 'object' && typeof obj[key] === 'object') {
          result[key] = filterObject(obj[key], allowedStructure[key]);
        }
      }
    }
    
    return result;
  };
  
  return filterObject(data, allowedFields);
}