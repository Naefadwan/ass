const fs = require('fs');
const csv = require('csv-parser');
const { sequelize } = require('../config/db');
const Medicine = require('../models/Medicine');

async function updatePrices() {
    try {
        const results = [];
        
        // Change this line
        fs.createReadStream('../price.csv')
        
        // To this (assuming price.csv is in the server folder)
        fs.createReadStream('../price.csv')
        
        // Or if it's in the project root
        fs.createReadStream('../../price.csv')
            .pipe(csv({
                headers: ['name', 'price'], // Manually set headers since yours seems corrupted
                skipLines: 1 // Skip the corrupted header line
            }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                for (const row of results) {
                    try {
                        // Update using medicine name as identifier
                        await Medicine.update(
                            { price: parseFloat(row.price) },
                            { where: { name: row.name.trim() } }
                        );
                        console.log(`Updated ${row.name} to ${row.price} SR`);
                    } catch (error) {
                        console.error(`Error updating ${row.name}:`, error.message);
                    }
                }
                console.log('Price update completed');
                sequelize.close();
            });
    } catch (error) {
        console.error('Error:', error);
    }
}

updatePrices();