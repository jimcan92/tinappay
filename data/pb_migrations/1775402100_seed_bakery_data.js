/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const categories = app.findCollectionByNameOrId("categories");
  const products = app.findCollectionByNameOrId("products");
  const ingredients = app.findCollectionByNameOrId("ingredients");

  // 1. Seed POS User
  const user = new Record(users, {
    "email": "jimcan051592@gmail.com",
    "password": "password123",
    "passwordConfirm": "password123",
    "name": "Jim Can",
    "role": "admin"
  });
  app.save(user);

  // 2. Seed Categories
  const catBread = new Record(categories, {
    "name": "Bread",
    "slug": "bread",
    "type": "product"
  });
  app.save(catBread);

  const catPastries = new Record(categories, {
    "name": "Pastries",
    "slug": "pastries",
    "type": "product"
  });
  app.save(catPastries);

  const catSupplies = new Record(categories, {
    "name": "Supplies",
    "slug": "supplies",
    "type": "ingredient"
  });
  app.save(catSupplies);

  // 3. Seed Products
  const panDeSal = new Record(products, {
    "name": "Pandesal",
    "price": 5.00,
    "category": catBread.id,
    "stock": 100,
    "active": true
  });
  app.save(panDeSal);

  const ensaymada = new Record(products, {
    "name": "Ensaymada",
    "price": 25.00,
    "category": catPastries.id,
    "stock": 50,
    "active": true
  });
  app.save(ensaymada);

  const monay = new Record(products, {
    "name": "Monay",
    "price": 10.00,
    "category": catBread.id,
    "stock": 80,
    "active": true
  });
  app.save(monay);

  // 4. Seed Ingredients
  const flour = new Record(ingredients, {
    "name": "All-purpose Flour",
    "unit": "kg",
    "current_stock": 50,
    "min_stock": 10,
    "max_stock": 100,
    "category": catSupplies.id
  });
  app.save(flour);

  const sugar = new Record(ingredients, {
    "name": "White Sugar",
    "unit": "kg",
    "current_stock": 20,
    "min_stock": 5,
    "max_stock": 50,
    "category": catSupplies.id
  });
  app.save(sugar);

  const yeast = new Record(ingredients, {
    "name": "Instant Dry Yeast",
    "unit": "pack",
    "current_stock": 30,
    "min_stock": 5,
    "max_stock": 50,
    "category": catSupplies.id
  });
  app.save(yeast);

  return;
}, (app) => {
  // Rollback logic (optional for seed)
})
