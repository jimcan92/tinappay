/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findRecordsByFilter("_pb_users_auth_", "active = false");

  for (const user of users) {
    user.set("active", true);
    app.save(user);
  }
}, (app) => {
  // no undo needed for data migration
})
