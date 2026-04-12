/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const categories = app.findCollectionByNameOrId("categories");
  const products = app.findCollectionByNameOrId("products");
  const ingredients = app.findCollectionByNameOrId("ingredients");
  const suppliers = app.findCollectionByNameOrId("suppliers");

  // Helper to create category
  const createCat = (name, slug, type) => {
    const record = new Record(categories);
    record.set("name", name);
    record.set("slug", slug);
    record.set("type", type);
    app.save(record);
    return record;
  };

  const catSourdough = createCat("Sourdough", "sourdough", "product");
  const catPastries = createCat("Pastries", "pastries", "product");
  const catCoffee = createCat("Coffee", "coffee", "product");
  const catCakes = createCat("Cakes", "cakes", "product");

  const catFlours = createCat("Flours", "flours", "ingredient");
  const catDairy = createCat("Dairy", "dairy", "ingredient");
  const catSweeteners = createCat("Sweeteners", "sweeteners", "ingredient");

  // Products
  const createProd = (name, price, catId, stock, description = "") => {
    const record = new Record(products);
    record.set("name", name);
    record.set("price", price);
    record.set("category", catId);
    record.set("stock", stock);
    record.set("description", description);
    record.set("active", true);
    app.save(record);
  };

  createProd("Classic Sourdough", 8.50, catSourdough.id, 8, "Signature Crust");
  createProd("Butter Croissant", 4.25, catPastries.id, 15, "Honeycomb Crumb");
  createProd("Rye Boule", 9.00, catSourdough.id, 2, "Dark & Hearty");
  createProd("Flat White", 5.50, catCoffee.id, 50, "Single Origin");
  createProd("Lemon Tart", 6.50, catPastries.id, 10, "Zesty Classic");
  createProd("Pain au Choc", 4.75, catPastries.id, 12, "Valrhona Fill");

  // Ingredients
  const createIng = (name, unit, current, min, max, catId, description = "") => {
    const record = new Record(ingredients);
    record.set("name", name);
    record.set("unit", unit);
    record.set("current_stock", current);
    record.set("min_stock", min);
    record.set("max_stock", max);
    record.set("category", catId);
    record.set("description", description);
    app.save(record);
  };

  createIng("Unbleached Flour", "kg", 12.5, 5, 50, catFlours.id, "King Arthur Special");
  createIng("Cultured Butter", "kg", 45.0, 10, 50, catDairy.id, "Grass-fed unsalted");
  createIng("Organic Honey", "L", 3.2, 2, 15, catSweeteners.id, "Wildflower Blend");
  createIng("Whole Milk", "L", 18.0, 5, 20, catDairy.id, "Local Dairy Fresh");
  createIng("Maldon Sea Salt", "kg", 8.5, 2, 10, catFlours.id, "Flaky finishing salt");
  createIng("Yeast Blend", "units", 2.4, 1, 10, catFlours.id);
  createIng("Organic Eggs", "count", 48, 24, 144, catDairy.id);

  // Suppliers
  const createSup = (name, categories_str, phone = "", email = "") => {
    const record = new Record(suppliers);
    record.set("name", name);
    record.set("categories", categories_str);
    record.set("phone", phone);
    record.set("email", email);
    app.save(record);
  };

  createSup("Grain & Co.", "Flour, Grains, Seeds", "555-0123", "orders@grainco.com");
  createSup("Dairy Fresh", "Milk, Butter, Cream", "555-0456", "sales@dairyfresh.com");

}, (app) => {
  // Rollback logic if needed
})
