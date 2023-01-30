const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1

const convertedObjectApi = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const validStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const validPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const validPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const validSearchQ = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const validCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const validCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const validCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q, status, priority, dueDate, category } = request.query;

  switch (true) {
    case validStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE status = '${status}';`;
      break;
    case validPriorityAndStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`;
      break;
    case validSearchQ(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
    case validCategoryAndStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
      break;
    case validCategory(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE category = '${category}';`;
      break;
    case validCategoryAndPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
      break;
    default:
    case validPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
  }
  data = await database.all(getTodoQuery);
  response.send(data.map((eachTodo) => convertedObjectApi(eachTodo)));
});

//API 2

const convertObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.dueDate,
  };
};

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo Where id = ${todoId};`;
  const todoQuery = await database.get(getQuery);
  response.send(convertObject(todoQuery));
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const formatDate = format(new Date(date), "yyyy-MM-dd");
  const getQuery = `SELECT * FROM todo WHERE due_date = ${formatDate};`;
  const queryDate = await database.get(getQuery);
  response.send(queryDate);
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const addTodo = `INSERT INTO todo (id,todo,priority,status,category,due_Date) VALUES 
    (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await database.run(addTodo);
  response.send("Todo Successfully Added");
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  if (request.body.status) {
    if (request.body.status === undefined) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const updateStatus = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
      await database.run(updateStatus);
      response.send("Status Updated");
    }
  } else if (request.body.priority) {
    if (request.body.priority === undefined) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const updatePriority = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
      await database.run(updatePriority);
      response.send("Priority Updated");
    }
  } else if (request.body.todo) {
    const updateTodo = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`;
    await database.run(updateTodo);
    response.send("Todo Updated");
  } else if (request.body.category) {
    if (request.body.category === undefined) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const updateCategory = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
      await database.run(updateCategory);
      response.send("Category Updated");
    }
  } else {
    if (request.body.dueDate === undefined) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const updateDate = `UPDATE todo SET due_date = '${dueDate}' WHERE id = ${todoId};`;
      await database.run(updateDate);
      response.send("Due Date Updated");
    }
  }
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE FROM todo WHERE id = ${todoId};`;
  await database.run(deleteTodo);
  response.send("Todo Deleted");
});
module.exports = app;
