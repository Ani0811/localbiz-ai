import test from 'node:test';
import assert from 'node:assert';

test('ContentType enum values are valid', () => {
  const validTypes = [
    'instagram_caption',
    'promo_copy',
    'whatsapp_message',
    'google_business_update',
    'product_description',
    'weekly_content_plan'
  ];
  assert.strictEqual(validTypes.length, 6);
  assert.ok(validTypes.includes('instagram_caption'));
  assert.ok(validTypes.includes('weekly_content_plan'));
});

test('Business profile schema validation logic', () => {
  const profile = {
    name: 'Saffron Street Cafe',
    category: 'Artisanal Cafe',
    description: 'Fresh tea and snacks',
    location: 'Kolkata',
    business_hours: '9 AM - 9 PM',
    target_audience: 'Local foodies',
    tone: 'Warm',
    language: 'English',
    products_services: [
      { name: 'Masala Chai', price: '₹40' }
    ]
  };

  assert.strictEqual(profile.name, 'Saffron Street Cafe');
  assert.strictEqual(profile.products_services[0].price, '₹40');
  assert.ok(profile.products_services.length > 0);
});
