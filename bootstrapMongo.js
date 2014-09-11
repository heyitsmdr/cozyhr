conn = new Mongo();

db = conn.getDB('cozy');

// Refresh
db.company.remove();
db.user.remove();

// Create the company
db.company.insert({
  name: "CozyHR, Inc",
  host: "cozyhr.cozyhr.com"
});

companyObject = db.company.find()[0]._id;

// Create the user
db.user.insert({
  admin: true,
  email: "local@cozyhr.com",
  password: "$2a$10$mHxnGtPsE3WyMeLF6rhRIeciO3KPb1b5MAaCABVYrZCxNql8QP2.K",
  company: companyObject,
  firstName: "Joe",
  lastName: "Smith",
  picture: ""
});