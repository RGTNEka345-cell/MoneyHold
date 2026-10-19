function fail(message, status = 422) { throw Object.assign(new Error(message), { status }); }
function text(value, max, label, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(`Enter a valid ${label} (maximum ${max} characters).`);
  return value.trim();
}
function integer(value, label, min = 0) {
  if (!Number.isSafeInteger(value) || value < min || value > 1000000000) fail(`Invalid ${label}.`);
  return value;
}
function category(body) {
  return { name: text(body.name, 80, 'category name'), description: text(body.description ?? '', 500, 'description', false) };
}
function product(body) {
  const name = text(body.name, 150, 'product name');
  const description = text(body.description, 5000, 'description');
  const price = String(body.price);
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(price) || Number(price) <= 0) fail('Price must be positive, with at most two decimal places.');
  integer(body.categoryId, 'category', 1);
  if (typeof body.active !== 'boolean') fail('Invalid product status.');
  if (!Array.isArray(body.variants) || body.variants.length < 1 || body.variants.length > 100) fail('Add between 1 and 100 size/colour variants.');
  const seen = new Set();
  const variants = body.variants.map(v => {
    const size = text(v.size, 20, 'size').toUpperCase();
    const colour = text(v.colour, 40, 'colour');
    const key = JSON.stringify([size, colour.toLowerCase()]);
    if (seen.has(key)) fail('Each size and colour combination must be unique.');
    seen.add(key);
    return { size, colour, stock: integer(v.stock, 'stock'), ...(v.id ? { id: integer(v.id, 'variant ID', 1) } : {}) };
  });
  const imageIds = body.imageIds ?? [];
  if (!Array.isArray(imageIds) || imageIds.length > 4 || new Set(imageIds).size !== imageIds.length) fail('Invalid image selection.');
  imageIds.forEach(id => integer(id, 'image ID', 1));
  return { name, description, price, categoryId: body.categoryId, active: body.active, variants, imageIds };
}
module.exports = { fail, integer, category, product };
