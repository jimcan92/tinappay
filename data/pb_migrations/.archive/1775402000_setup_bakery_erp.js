/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Helper para sa pag-add og System Fields (ID, Created, Updated)
  // Kini aron masiguro nga ma-query nimo ang 'created' field sa Svelte
  const addSystemFields = (collection) => {
    collection.fields.add(new SchemaField({
      "name": "id",
      "type": "text",
      "system": true,
      "primaryKey": true,
      "required": true,
      "autogeneratePattern": "[a-z0-9]{15}"
    }));
    collection.fields.add(new SchemaField({
      "name": "created",
      "type": "autofill",
      "system": true
    }));
    collection.fields.add(new SchemaField({
      "name": "updated",
      "type": "autofill",
      "system": true
    }));
  };

  // 1. Categories
  const categories = new Collection({
    "name": "categories",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''"
  });
  addSystemFields(categories);
  categories.fields.add(new TextField({ "name": "name", "required": true }));
  categories.fields.add(new TextField({ "name": "slug", "required": true }));
  categories.fields.add(new SelectField({
    "name": "type",
    "required": true,
    "values": ["product", "ingredient"]
  }));
  app.save(categories);

  // 2. Products
  const products = new Collection({
    "name": "products",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''"
  });
  addSystemFields(products);
  products.fields.add(new TextField({ "name": "name", "required": true }));
  products.fields.add(new TextField({ "name": "description" }));
  products.fields.add(new NumberField({ "name": "price", "required": true }));
  products.fields.add(new RelationField({ "name": "category", "required": true, "collectionId": categories.id, "maxSelect": 1 }));
  products.fields.add(new FileField({ "name": "image", "maxSelect": 1, "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"] }));
  products.fields.add(new NumberField({ "name": "stock" }));
  products.fields.add(new BoolField({ "name": "active" }));
  app.save(products);

  // 3. Ingredients
  const ingredients = new Collection({
    "name": "ingredients",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''"
  });
  addSystemFields(ingredients);
  ingredients.fields.add(new TextField({ "name": "name", "required": true }));
  ingredients.fields.add(new TextField({ "name": "description" }));
  ingredients.fields.add(new TextField({ "name": "unit", "required": true }));
  ingredients.fields.add(new NumberField({ "name": "current_stock", "required": true }));
  ingredients.fields.add(new NumberField({ "name": "min_stock", "required": true }));
  ingredients.fields.add(new NumberField({ "name": "max_stock", "required": true }));
  ingredients.fields.add(new RelationField({ "name": "category", "collectionId": categories.id, "maxSelect": 1 }));
  app.save(ingredients);

  // 4. Suppliers
  const suppliers = new Collection({
    "name": "suppliers",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''"
  });
  addSystemFields(suppliers);
  suppliers.fields.add(new TextField({ "name": "name", "required": true }));
  suppliers.fields.add(new TextField({ "name": "phone" }));
  suppliers.fields.add(new EmailField({ "name": "email" }));
  app.save(suppliers);

  // 5. Orders
  const orders = new Collection({
    "name": "orders",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''"
  });
  addSystemFields(orders);
  orders.fields.add(new NumberField({ "name": "total", "required": true }));
  orders.fields.add(new SelectField({ "name": "status", "values": ["completed", "cancelled"] }));
  orders.fields.add(new RelationField({ "name": "cashier", "required": true, "collectionId": "_pb_users_auth_", "maxSelect": 1 }));
  app.save(orders);

  // 6. Order Items
  const order_items = new Collection({
    "name": "order_items",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''"
  });
  addSystemFields(order_items);
  order_items.fields.add(new RelationField({ "name": "order", "required": true, "collectionId": orders.id, "maxSelect": 1, "cascadeDelete": true }));
  order_items.fields.add(new RelationField({ "name": "product", "required": true, "collectionId": products.id, "maxSelect": 1 }));
  order_items.fields.add(new NumberField({ "name": "quantity", "required": true }));
  order_items.fields.add(new NumberField({ "name": "price", "required": true }));
  order_items.fields.add(new NumberField({ "name": "subtotal", "required": true }));
  app.save(order_items);

  // 7. Inventory Logs
  const inventory_logs = new Collection({
    "name": "inventory_logs",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''"
  });
  addSystemFields(inventory_logs);
  inventory_logs.fields.add(new RelationField({ "name": "product", "collectionId": products.id, "maxSelect": 1 }));
  inventory_logs.fields.add(new NumberField({ "name": "quantity", "required": true }));
  inventory_logs.fields.add(new SelectField({ "name": "reason", "required": true, "values": ["sale", "restock", "waste", "adjustment"] }));
  app.save(inventory_logs);

}, (app) => {
  const collections = ["inventory_logs", "order_items", "orders", "suppliers", "ingredients", "products", "categories"];
  for (const name of collections) {
    const collection = app.findCollectionByNameOrId(name);
    if (collection) app.delete(collection);
  }
})