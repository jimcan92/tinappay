/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // Try to find your user in the 'users' collection
    let ownerId = "";
    try {
        const user = app.findFirstRecordByData("users", "email", "jimcan051592@gmail.com");
        if (user) ownerId = user.id;
    } catch (e) {
        // Fallback to first user if any
        try {
            const users = app.findCollectionByNameOrId("users");
            const firstUser = app.findAllRecords(users)[0];
            if (firstUser) ownerId = firstUser.id;
        } catch (err) {}
    }

    const equipments = [
        { name: "Digital Microscope X-100", status: "Available" },
        { name: "Centrifuge Model 5418", status: "In Use" },
        { name: "Autoclave Sterilizer 50L", status: "Maintenance" },
        { name: "pH Meter - Laboratory Grade", status: "Available" },
        { name: "Spectrophotometer UV-VIS", status: "Available" },
        { name: "Analytical Balance 0.1mg", status: "In Use" }
    ];

    const equipmentRecords = [];
    const eqColl = app.findCollectionByNameOrId("equipments");

    for (const eq of equipments) {
        const record = new Record(eqColl);
        record.set("name", eq.name);
        record.set("status", eq.status);
        if (ownerId) record.set("owner", ownerId);
        app.save(record);
        equipmentRecords.push(record);
    }

    // 1. Dummy Borrowing Data
    const borrowColl = app.findCollectionByNameOrId("borrowing");
    const names = ["Juan Dela Cruz", "Maria Clara", "Pedro Penduko", "Simoun Ibarra"];
    
    for (let i = 0; i < 4; i++) {
        const record = new Record(borrowColl);
        record.set("equipment", equipmentRecords[i % equipmentRecords.length].id);
        record.set("borrower_name", names[i]);
        record.set("borrow_date", new Date().toISOString());
        record.set("status", i === 0 ? "Returned" : "Borrowed");
        if (i === 0) record.set("return_date", new Date().toISOString());
        app.save(record);
    }

    // 2. Dummy Maintenance (PMS) Data
    const pmsColl = app.findCollectionByNameOrId("maintenance");
    const tasks = ["Clean optical lens", "Replace fuse", "Check pressure valve", "Calibration check"];
    
    for (let i = 0; i < 4; i++) {
        const record = new Record(pmsColl);
        record.set("equipment", equipmentRecords[i % equipmentRecords.length].id);
        record.set("task_description", tasks[i]);
        record.set("scheduled_date", new Date().toISOString());
        record.set("status", i % 2 === 0 ? "Pending" : "Completed");
        if (i % 2 !== 0) record.set("completed_date", new Date().toISOString());
        app.save(record);
    }

    // 3. Dummy Calibration Data
    const calColl = app.findCollectionByNameOrId("calibration");
    
    for (let i = 0; i < 3; i++) {
        const record = new Record(calColl);
        record.set("equipment", equipmentRecords[(i + 2) % equipmentRecords.length].id);
        record.set("last_calibrated", "2024-01-15");
        record.set("next_due", i === 0 ? "2024-02-01" : "2026-06-15"); 
        record.set("certificate_ref", `CERT-2024-${100 + i}`);
        record.set("status", i === 0 ? "Expired" : "Valid");
        app.save(record);
    }

    return null;
}, (app) => {
    return null;
})
