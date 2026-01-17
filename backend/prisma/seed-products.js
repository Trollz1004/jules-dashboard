import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Product definitions
const BABY_AI_PRODUCTS = [
  {
    name: 'Baby AI Architect',
    description: 'The visionary. Designed for those who build the future. 100% of proceeds go to verified pediatric charities.',
    price: 24.99,
    category: 't-shirt',
    baseSku: 'BAI-ARCH',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Royal Blue', 'Navy'],
  },
  {
    name: 'Baby AI Integrator',
    description: 'The connector. For those who bring systems together. 100% supports verified pediatric charities.',
    price: 24.99,
    category: 't-shirt',
    baseSku: 'BAI-INTG',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Gold', 'Mustard Yellow'],
  },
  {
    name: 'Baby AI Engineer',
    description: 'The builder. For the ones who make things work. Every purchase heals kids.',
    price: 24.99,
    category: 't-shirt',
    baseSku: 'BAI-ENG',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Heather Gray', 'Charcoal'],
  },
  {
    name: 'Baby AI Researcher',
    description: 'The explorer. Finding answers to impossible questions. 100% to verified pediatric charities.',
    price: 24.99,
    category: 't-shirt',
    baseSku: 'BAI-RES',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Teal', 'Seafoam'],
  },
  {
    name: 'FOR THE KIDS Mission Shirt',
    description: 'The mission statement. Wear your purpose. 100% directly to verified pediatric charities.',
    price: 29.99,
    category: 't-shirt',
    baseSku: 'BAI-KIDS',
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['Forest Green', 'Lime Green'],
  },
];

/**
 * Generate SKU for a variant
 * Format: BASE-SKU-COLOR-SIZE (e.g., BAI-ARCH-BLU-M)
 */
function generateSku(baseSku, color, size) {
  // Convert color to 3-letter code
  const colorMap = {
    'Royal Blue': 'RBL',
    'Navy': 'NVY',
    'Gold': 'GLD',
    'Mustard Yellow': 'MYL',
    'Heather Gray': 'HGR',
    'Charcoal': 'CHR',
    'Teal': 'TEL',
    'Seafoam': 'SFM',
    'Forest Green': 'FGR',
    'Lime Green': 'LGR',
  };

  const colorCode = colorMap[color] || color.substring(0, 3).toUpperCase();
  return `${baseSku}-${colorCode}-${size}`;
}

/**
 * Seed the database with Baby AI products
 */
async function seedProducts() {
  try {
    console.log('Starting product seed...');

    // Clear existing products (optional)
    console.log('Clearing existing products...');
    await prisma.orderItem.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});

    // Create products
    console.log('Creating products and variants...');
    for (const productData of BABY_AI_PRODUCTS) {
      const { name, description, price, category, baseSku, sizes, colors } = productData;

      // Create the product
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price.toString()),
          category,
          sku: baseSku,
          active: true,
        },
      });

      console.log(`Created product: ${name} (ID: ${product.id})`);

      // Create variants for each size/color combination
      const variants = [];
      for (const color of colors) {
        for (const size of sizes) {
          const sku = generateSku(baseSku, color, size);
          const variant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              size,
              color,
              sku,
              stockQuantity: 100,
            },
          });

          variants.push(variant);
          console.log(`  Created variant: ${color} - ${size} (SKU: ${sku})`);
        }
      }

      console.log(`Total variants for ${name}: ${variants.length}`);
    }

    console.log('Product seeding completed successfully!');

    // Display summary
    const productCount = await prisma.product.count();
    const variantCount = await prisma.productVariant.count();
    console.log(`\nSummary:`);
    console.log(`  Total Products: ${productCount}`);
    console.log(`  Total Variants: ${variantCount}`);

  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedProducts()
  .then(() => {
    console.log('Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
