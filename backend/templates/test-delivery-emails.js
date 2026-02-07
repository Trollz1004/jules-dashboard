/**
 * TEST FILE: Delivery Email Templates
 *
 * Run this to generate sample emails and verify templates work correctly
 *
 * Usage: node test-delivery-emails.js
 */

import { getDeliveryEmail, validateCustomerInfo } from './delivery-emails.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample customer data
const sampleCustomer = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  orderId: 'ORDER-2025-001234',
  orderDate: 'December 21, 2025'
};

const sampleCustomerWithAddress = {
  ...sampleCustomer,
  shippingAddress: '123 Main Street\nApt 4B\nNew York, NY 10001\nUnited States'
};

const merchCustomer = {
  ...sampleCustomerWithAddress,
  productName: 'AI Solutions Store T-Shirt (Medium, Black)'
};

// Test all templates
const tests = [
  { id: 'claude-droid', name: 'Claude Droid', customer: sampleCustomer },
  { id: 'income-droid', name: 'Income Droid', customer: sampleCustomer },
  { id: 'marketing-engine', name: 'Marketing Engine', customer: sampleCustomer },
  { id: 'jules-ai', name: 'Jules AI', customer: sampleCustomer },
  { id: 'affiliate-system', name: 'Affiliate System', customer: sampleCustomer },
  { id: 'dating-platform', name: 'Dating Platform', customer: sampleCustomer },
  { id: 'consultation', name: 'Consultation', customer: sampleCustomer },
  { id: 'merchandise', name: 'Merchandise', customer: merchCustomer }
];

// Create output directory
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('\n🧪 Testing Delivery Email Templates\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

tests.forEach(test => {
  try {
    console.log(`\nTesting: ${test.name}...`);

    // Validate customer info
    validateCustomerInfo(test.customer);
    console.log('  ✓ Customer info validation passed');

    // Generate email
    const html = getDeliveryEmail(test.id, test.customer);
    console.log('  ✓ Email template generated');

    // Verify HTML structure
    if (!html.includes('<!DOCTYPE html>')) {
      throw new Error('Missing DOCTYPE declaration');
    }
    if (!html.includes(test.customer.name)) {
      throw new Error('Customer name not found in email');
    }
    if (!html.includes(test.customer.email)) {
      throw new Error('Customer email not found in email');
    }
    if (!html.includes(test.customer.orderId)) {
      throw new Error('Order ID not found in email');
    }
    console.log('  ✓ HTML structure validation passed');

    // Save to file
    const filename = `${test.id}.html`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, html, 'utf8');
    console.log(`  ✓ Saved to: ${filename}`);

    passed++;
    console.log(`  ✅ ${test.name} - PASSED`);

  } catch (error) {
    failed++;
    console.log(`  ❌ ${test.name} - FAILED`);
    console.error(`     Error: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results:`);
console.log(`   Passed: ${passed}/${tests.length}`);
console.log(`   Failed: ${failed}/${tests.length}`);
console.log(`\n📁 Output Directory: ${outputDir}`);
console.log(`\n💡 Open the HTML files in a browser to preview emails\n`);

// Test error handling
console.log('\n🔍 Testing Error Handling\n');
console.log('='.repeat(60));

try {
  console.log('\nTest: Invalid product ID...');
  getDeliveryEmail('invalid-product', sampleCustomer);
  console.log('  ❌ Should have thrown error');
} catch (error) {
  console.log('  ✓ Correctly threw error:', error.message);
}

try {
  console.log('\nTest: Missing customer name...');
  validateCustomerInfo({ email: 'test@test.com', orderId: '123', orderDate: 'Today' });
  console.log('  ❌ Should have thrown error');
} catch (error) {
  console.log('  ✓ Correctly threw error:', error.message);
}

try {
  console.log('\nTest: Invalid email format...');
  validateCustomerInfo({ name: 'Test', email: 'invalid-email', orderId: '123', orderDate: 'Today' });
  console.log('  ❌ Should have thrown error');
} catch (error) {
  console.log('  ✓ Correctly threw error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ All tests completed!\n');

// Summary
if (failed === 0) {
  console.log('🎉 All email templates are working correctly!');
  console.log('\nNext steps:');
  console.log('  1. Review generated HTML files in test-output/');
  console.log('  2. Integrate with email service (SendGrid, AWS SES, etc.)');
  console.log('  3. Add to Square webhook handler for automatic delivery');
  console.log('  4. Test with real customer data');
} else {
  console.log('⚠️  Some tests failed. Please review errors above.');
  process.exit(1);
}
