/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. Categories
  const categories = new Collection({
    "name": "categories",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''",
    "fields": [
      { "name": "name", "type": "text", "required": true },
      { "name": "slug", "type": "text", "required": true },
      {
        "name": "type",
        "type": "select",
        "required": true,
        "options": { "values": ["product", "ingredient"], "maxSelect": 1 }
      }
    ]
  });
  app.save(categories);

  // 2. Products
  const products = new Collection({
    "name": "products",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''",
    "fields": [
      { "name": "name", "type": "text", "required": true },
      { "name": "description", "type": "text" },
      { "name": "price", "type": "number", "required": true },
      {
        "name": "category",
        "type": "relation",
        "required": true,
        "options": { "collectionId": categories.id, "maxSelect": 1 }
      },
      { "name": "stock", "type": "number" },
      { "name": "active", "type": "bool" }
    ]
  });
  app.save(products);

  // 3. Orders
  const orders = new Collection({
    "name": "orders",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''",
    "fields": [
      { "name": "total", "type": "number", "required": true },
      {
        "name": "status",
        "type": "select",
        "options": { "values": ["completed", "cancelled"], "maxSelect": 1 }
      },
      {
        "name": "cashier",
        "type": "relation",
        "required": true,
        "options": { "collectionId": "_pb_users_auth_", "maxSelect": 1 }
      }
    ]
  });
  app.save(orders);

  // 4. Order Items
  const order_items = new Collection({
    "name": "order_items",
    "type": "base",
    "listRule": "id != ''", "viewRule": "id != ''", "createRule": "id != ''", "updateRule": "id != ''", "deleteRule": "id != ''",
    "fields": [
      {
        "name": "order",
        "type": "relation",
        "required": true,
        "options": { "collectionId": orders.id, "maxSelect": 1, "cascadeDelete": true }
      },
      {
        "name": "product",
        "type": "relation",
        "required": true,
        "options": { "collectionId": products.id, "maxSelect": 1 }
      },
      { "name": "quantity", "type": "number", "required": true },
      { "name": "price", "type": "number", "required": true },
      { "name": "subtotal", "type": "number", "required": true }
    ]
  });
  app.save(order_items);

}, (app) => {
  const collections = ["order_items", "orders", "products", "categories"];
  for (const name of collections) {
    const col = app.findCollectionByNameOrId(name);
    if (col) app.delete(col);
  }
});