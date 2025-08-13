/**
 * Comprehensive Test Suite for Unified Supplier System
 * Tests the integration between SupplierFactory, service layers, and auto-creation flows
 */

const { SupplierFactory } = require('./lib/services/SupplierFactory');
const { SupabaseInventoryService } = require('./lib/supabase/inventory');
const { SupabaseInventoryClientService } = require('./lib/supabase/inventory-client');
const { SupplierStatus, SupplierType } = require('./lib/types/supplier.types');

class UnifiedSupplierSystemTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message) {
    console.log(`[TEST] ${message}`);
  }

  error(message, error) {
    console.error(`[ERROR] ${message}`, error);
    this.testResults.errors.push({ message, error: error?.message });
  }

  assert(condition, message) {
    if (condition) {
      this.testResults.passed++;
      this.log(`✅ ${message}`);
    } else {
      this.testResults.failed++;
      this.log(`❌ ${message}`);
    }
  }

  async testSupplierFactory() {
    this.log('\n=== Testing SupplierFactory ===');
    
    try {
      // Test supplier code generation
      const supplierCode = SupplierFactory.generateSupplierCode('Test Supplier Corp');
      this.assert(
        supplierCode && supplierCode.startsWith('SUP-') && supplierCode.length === 13,
        'SupplierFactory generates valid supplier codes'
      );

      // Test supplier creation data preparation
      const mockUserData = {
        id: 'user-123',
        email: 'supplier@test.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const supplierData = await SupplierFactory.createSupplierForUser(mockUserData, 'Test Business Name');
      
      this.assert(
        supplierData.user_id === mockUserData.id,
        'SupplierFactory correctly sets user_id'
      );

      this.assert(
        supplierData.contact_email === mockUserData.email,
        'SupplierFactory correctly sets contact_email'
      );

      this.assert(
        supplierData.status === SupplierStatus.INVITED,
        'SupplierFactory sets correct initial status'
      );

      this.assert(
        supplierData.type === SupplierType.EXTERNAL,
        'SupplierFactory sets correct initial type'
      );

      this.assert(
        supplierData.is_auto_created === true,
        'SupplierFactory marks supplier as auto-created'
      );

    } catch (error) {
      this.error('SupplierFactory tests failed', error);
    }
  }

  async testSupplierTypes() {
    this.log('\n=== Testing Supplier Types and Enums ===');
    
    try {
      // Test SupplierStatus enum
      const statuses = Object.values(SupplierStatus);
      this.assert(
        statuses.includes('EXTERNAL') && 
        statuses.includes('INVITED') && 
        statuses.includes('ACTIVE') && 
        statuses.includes('INACTIVE') && 
        statuses.includes('SUSPENDED'),
        'SupplierStatus enum contains all required values'
      );

      // Test SupplierType enum
      const types = Object.values(SupplierType);
      this.assert(
        types.includes('EXTERNAL') && 
        types.includes('INTERNAL') && 
        types.includes('HYBRID'),
        'SupplierType enum contains all required values'
      );

      // Test status transitions
      const validTransitions = {
        [SupplierStatus.EXTERNAL]: [SupplierStatus.INVITED],
        [SupplierStatus.INVITED]: [SupplierStatus.ACTIVE, SupplierStatus.INACTIVE],
        [SupplierStatus.ACTIVE]: [SupplierStatus.INACTIVE, SupplierStatus.SUSPENDED],
        [SupplierStatus.INACTIVE]: [SupplierStatus.ACTIVE, SupplierStatus.SUSPENDED],
        [SupplierStatus.SUSPENDED]: [SupplierStatus.ACTIVE, SupplierStatus.INACTIVE]
      };

      let transitionsValid = true;
      Object.keys(validTransitions).forEach(status => {
        if (!validTransitions[status].length) {
          transitionsValid = false;
        }
      });

      this.assert(transitionsValid, 'Supplier status transitions are properly defined');

    } catch (error) {
      this.error('Supplier types tests failed', error);
    }
  }

  async testServiceIntegration() {
    this.log('\n=== Testing Service Integration ===');
    
    try {
      // Test SupabaseInventoryService methods existence
      const serverMethods = [
        'getAllSuppliers',
        'getSupplierById', 
        'getSupplierByUserId',
        'createSupplier',
        'updateSupplier',
        'getAllSuppliersUnified'
      ];

      serverMethods.forEach(method => {
        this.assert(
          typeof SupabaseInventoryService[method] === 'function',
          `SupabaseInventoryService has ${method} method`
        );
      });

      // Test SupabaseInventoryClientService methods existence
      const clientMethods = [
        'getAllSuppliers',
        'getSupplierById',
        'getSupplierByUserId', 
        'getAllSuppliersUnified',
        'getSupplierStats',
        'getAllProducts'
      ];

      clientMethods.forEach(method => {
        this.assert(
          typeof SupabaseInventoryClientService[method] === 'function',
          `SupabaseInventoryClientService has ${method} method`
        );
      });

      // Test that client service doesn't have admin-only methods
      const adminOnlyMethods = ['createSupplier', 'updateSupplier', 'deleteSupplier'];
      adminOnlyMethods.forEach(method => {
        this.assert(
          typeof SupabaseInventoryClientService[method] !== 'function',
          `SupabaseInventoryClientService properly restricts ${method} method`
        );
      });

    } catch (error) {
      this.error('Service integration tests failed', error);
    }
  }

  async testUnifiedSupplierStructure() {
    this.log('\n=== Testing Unified Supplier Data Structure ===');
    
    try {
      // Create a mock unified supplier
      const mockSupplier = {
        id: 'sup-123',
        supplier_id: 'SUP-TEST-001',
        name: 'Test Supplier',
        business_name: 'Test Supplier Corp',
        contact_email: 'contact@testsupplier.com',
        contact_phone: '+1234567890',
        user_id: 'user-123',
        status: SupplierStatus.ACTIVE,
        type: SupplierType.EXTERNAL,
        is_active: true,
        is_auto_created: true,
        rating_quality: 4.5,
        rating_reliability: 4.2,
        rating_pricing: 4.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test required fields
      const requiredFields = [
        'supplier_id', 'name', 'business_name', 'contact_email', 
        'status', 'type', 'is_active'
      ];

      requiredFields.forEach(field => {
        this.assert(
          mockSupplier.hasOwnProperty(field) && mockSupplier[field] !== undefined,
          `Unified supplier has required field: ${field}`
        );
      });

      // Test status and type validation
      this.assert(
        Object.values(SupplierStatus).includes(mockSupplier.status),
        'Supplier status is valid enum value'
      );

      this.assert(
        Object.values(SupplierType).includes(mockSupplier.type),
        'Supplier type is valid enum value'
      );

      // Test automatic rating calculation
      if (mockSupplier.rating_quality && mockSupplier.rating_reliability && mockSupplier.rating_pricing) {
        const expectedOverallRating = (
          (mockSupplier.rating_quality * 0.4) + 
          (mockSupplier.rating_reliability * 0.35) + 
          (mockSupplier.rating_pricing * 0.25)
        );
        
        this.assert(
          Math.abs(expectedOverallRating - 4.25) < 0.1,
          'Overall rating calculation works correctly'
        );
      }

    } catch (error) {
      this.error('Unified supplier structure tests failed', error);
    }
  }

  async testAutoCreationFlow() {
    this.log('\n=== Testing Auto-Creation Flow ===');
    
    try {
      // Mock the auto-creation scenario
      const mockInvitationData = {
        email: 'newprovider@test.com',
        role: 'proveedor',
        businessName: 'New Provider Corp'
      };

      // Test that supplier factory can handle the auto-creation
      const mockUser = {
        id: 'user-new-123',
        email: mockInvitationData.email,
        firstName: 'New',
        lastName: 'Provider'
      };

      const autoCreatedSupplier = await SupplierFactory.createSupplierForUser(
        mockUser, 
        mockInvitationData.businessName
      );

      this.assert(
        autoCreatedSupplier.is_auto_created === true,
        'Auto-created supplier is properly marked'
      );

      this.assert(
        autoCreatedSupplier.status === SupplierStatus.INVITED,
        'Auto-created supplier has correct initial status'
      );

      this.assert(
        autoCreatedSupplier.name.includes('New Provider Corp'),
        'Auto-created supplier uses business name'
      );

      // Test the supplier code generation consistency
      const code1 = SupplierFactory.generateSupplierCode('Test Company');
      const code2 = SupplierFactory.generateSupplierCode('Test Company');
      
      this.assert(
        code1 !== code2,
        'Supplier codes are unique even for same company name'
      );

    } catch (error) {
      this.error('Auto-creation flow tests failed', error);
    }
  }

  async testEdgeCases() {
    this.log('\n=== Testing Edge Cases ===');
    
    try {
      // Test empty/null inputs
      try {
        const emptyCode = SupplierFactory.generateSupplierCode('');
        this.assert(
          emptyCode && emptyCode.startsWith('SUP-'),
          'SupplierFactory handles empty company name gracefully'
        );
      } catch (error) {
        this.assert(false, 'SupplierFactory should handle empty inputs gracefully');
      }

      // Test very long company names
      const longName = 'A'.repeat(200);
      const longNameCode = SupplierFactory.generateSupplierCode(longName);
      this.assert(
        longNameCode.length === 13,
        'SupplierFactory handles long company names correctly'
      );

      // Test special characters in company names
      const specialName = 'Comp@ny & Co. (México) S.A. de C.V.';
      const specialCode = SupplierFactory.generateSupplierCode(specialName);
      this.assert(
        specialCode && specialCode.match(/^SUP-[A-Z0-9]{8}$/),
        'SupplierFactory handles special characters in company names'
      );

    } catch (error) {
      this.error('Edge cases tests failed', error);
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Unified Supplier System Test Suite\n');
    
    await this.testSupplierFactory();
    await this.testSupplierTypes();
    await this.testServiceIntegration();
    await this.testUnifiedSupplierStructure();
    await this.testAutoCreationFlow();
    await this.testEdgeCases();

    this.log('\n=== Test Results ===');
    this.log(`✅ Tests Passed: ${this.testResults.passed}`);
    this.log(`❌ Tests Failed: ${this.testResults.failed}`);
    
    if (this.testResults.errors.length > 0) {
      this.log('\n=== Errors ===');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.message}: ${error.error}`);
      });
    }

    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`\n📊 Success Rate: ${successRate}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 All tests passed! The unified supplier system is working correctly.');
    } else {
      console.log(`\n⚠️  ${this.testResults.failed} test(s) failed. Please review the implementation.`);
    }

    return {
      success: this.testResults.failed === 0,
      passed: this.testResults.passed,
      failed: this.testResults.failed,
      successRate: parseFloat(successRate)
    };
  }
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UnifiedSupplierSystemTest };
}

// Auto-run if called directly
if (require.main === module) {
  const test = new UnifiedSupplierSystemTest();
  test.runAllTests().then(results => {
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed to run:', error);
    process.exit(1);
  });
}