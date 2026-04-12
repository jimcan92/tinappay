migrate((app) => {
    const eqColl = app.findCollectionByNameOrId("equipments");
    const records = app.findAllRecords(eqColl);
    
    const names = [
        "Digital Microscope X-100", 
        "Centrifuge Model 5418", 
        "Autoclave Sterilizer 50L", 
        "pH Meter - Laboratory Grade", 
        "Spectrophotometer UV-VIS", 
        "Analytical Balance 0.1mg"
    ];

    for (let i = 0; i < records.length; i++) {
        records[i].set("name", names[i % names.length]);
        app.save(records[i]);
    }
}, (app) => {})
