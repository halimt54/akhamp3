require('dotenv').config()

const mysql = require('mysql2/promise');

const mysqlConfig = {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
	password: process.env.DB_PASS
}
let pool;
console.log(mysqlConfig)

function initPool() {
	pool = mysql.createPool(mysqlConfig)
}

async function terminatePool() {
	if (pool) {
		await pool.end()
	}
}

async function select(sqlQuery, parametersArray) {
	const [results, fields] = await pool.query(sqlQuery, parametersArray)
	return results
}

async function autoIncrementInsert(sqlQuery, parametersArray) {
	const [results, fields] = await pool.query(sqlQuery, parametersArray)
	return results.insertId
}

async function update(sqlQuery, parametersArray) {
	const [results, fields] = await pool.query(sqlQuery, parametersArray)
	return results.affectedRows > 0
}

initPool()

module.exports = {
	terminatePool,
	select,
	autoIncrementInsert,
	insert: update,
	update,
	delete: update
}
