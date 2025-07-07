import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/inventory/Product";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const formData = await request.formData();
    const productDataString = formData.get("productData") as string;
    
    if (!productDataString) {
      return NextResponse.json({ error: "Product data is required" }, { status: 400 });
    }

    const productData = JSON.parse(productDataString);
    const images = formData.getAll("images") as File[];

    // Validate required fields
    if (!productData.name || !productData.description || !productData.category || !productData.sku || !productData.price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Process images
    const imageUrls: string[] = [];
    
    if (images.length > 0) {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
      
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, that's okay
      }

      // Process each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const extension = image.name.split('.').pop();
        const filename = `${productData.sku}-${timestamp}-${randomId}.${extension}`;
        
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);
        
        // Store relative URL
        imageUrls.push(`/uploads/products/${filename}`);
      }
    }

    // Create product in database
    const product = new Product({
      productId: `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: productData.name,
      description: productData.description,
      category: productData.category,
      subcategory: productData.subcategory || "",
      sku: productData.sku,
      brand: productData.brand || "",
      specifications: productData.specifications || "",
      tags: productData.tags || [],
      images: imageUrls,
      isActive: false, // New products need approval
      suppliers: [{
        supplierId: productData.supplierId,
        supplierName: "Proveedor", // This should be fetched from supplier data
        price: productData.price,
        minQuantity: productData.minQuantity || 1,
        maxQuantity: productData.maxQuantity || 1000,
        unit: productData.unit,
        leadTime: 7, // Default lead time
        isPreferred: false,
        isActive: true
      }],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await product.save();

    return NextResponse.json({ 
      success: true, 
      message: "Product created successfully",
      productId: product.productId
    });

  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
    }

    // Get products for this supplier
    const products = await Product.find({
      "suppliers.supplierId": supplierId
    }).sort({ createdAt: -1 });

    // Transform the data
    const transformedProducts = products.map(product => {
      const supplierData = product.suppliers.find((s: any) => s.supplierId === supplierId);
      
      return {
        _id: product._id.toString(),
        productId: product.productId,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        sku: product.sku,
        brand: product.brand,
        images: product.images,
        isActive: product.isActive,
        supplier: supplierData ? {
          price: supplierData.price,
          minQuantity: supplierData.minQuantity,
          maxQuantity: supplierData.maxQuantity,
          unit: supplierData.unit,
          leadTime: supplierData.leadTime,
          isActive: supplierData.isActive
        } : null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    return NextResponse.json(transformedProducts);

  } catch (error) {
    console.error("Error fetching supplier products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}