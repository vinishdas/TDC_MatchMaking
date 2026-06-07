const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'data', 'database.json');
const dbPath2 = path.join(__dirname, 'src', 'data', 'mockProfiles.json');

function resetDb(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const updatedCustomers = data.map(c => {
      return {
        ...c,
        statusTag: 'Active Search',
        suggestedMatches: [],
        matchedWithId: null
      };
    });
    fs.writeFileSync(file, JSON.stringify(updatedCustomers, null, 2));
    console.log("Database normalized in " + file);
  } catch (e) {
    console.error("Error updating", file, e);
  }
}

resetDb(dbPath);
resetDb(dbPath2);
