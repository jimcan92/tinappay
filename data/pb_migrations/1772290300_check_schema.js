migrate((app) => {
    const collection = app.findCollectionByNameOrId("equipments");
    console.log("SCHEMA: " + JSON.stringify(collection.schema));
}, (app) => {})
