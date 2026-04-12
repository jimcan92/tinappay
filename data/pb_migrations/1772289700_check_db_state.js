migrate((app) => {
    const users = app.findCollectionByNameOrId("users");
    const userRecords = app.findAllRecords(users);
    console.log("TOTAL USERS: " + userRecords.length);
    
    const eq = app.findCollectionByNameOrId("equipments");
    const eqRecords = app.findAllRecords(eq);
    console.log("TOTAL EQUIPMENTS: " + eqRecords.length);
}, (app) => {})
