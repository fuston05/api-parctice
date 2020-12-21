// users-model, shared by userRouter, and authRouter
const db = require("../db-config");

module.exports = {
  find,
  findById,
  findByUserName,
  findByEmail,
  login,
  register,
  updateUser,
  deleteUser,
};

// get all users
function find(role_id) {
  // will only show salary information if the user is at least Admin role (>=2)
  if (role_id >= 2) {
    return db("users as u")
      .join("roles as r", "u.role_id", "=", "r.id")
      .join("employment_info as e", "u.employment_info_id", "=", "e.id")
      .select(
        "u.id",
        "u.userName",
        "u.email",
        "r.roleName",
        "u.salary",
        "e.job_title",
        "e.department",
        "e.hire_date"
      );
  } else {
    // if the user is NOT at least Admin(2) role, exclude salary info
    return db("users as u")
      .join("roles as r", "u.role_id", "=", "r.id")
      .join("employment_info as e", "u.employment_info_id", "=", "e.id")
      .select(
        "u.id",
        "u.userName",
        "u.email",
        "r.roleName",
        "e.job_title",
        "e.department",
        "e.hire_date"
      );
  }
}

// get a user by id
function findById(id, role_id) {
  // will only show salary information if the user is at least Admin role (>=2)
  if (role_id >= 2) {
    return db("users as u")
      .join("roles as r", "u.role_id", "=", "r.id")
      .join("employment_info as e", "u.employment_info_id", "=", "e.id")
      .where({ "u.id": id })
      .first()
      .select(
        "u.id",
        "u.userName",
        "u.email",
        "r.roleName",
        "u.salary",
        "e.job_title",
        "e.department",
        "e.hire_date"
      );
  } else {
    // if the user is NOT at least Admin(2) role, exclude salary info
    return db("users as u")
      .join("roles as r", "users.role_id", "=", "roles.id")
      .join("employment_info as e", "u.employment_info_id", "=", "e.id")
      .where({ "u.id": id })
      .first()
      .select(
        "u.id",
        "u.userName",
        "u.email",
        "r.roleName",
        "e.job_title",
        "e.department",
        "e.hire_date"
      );
  }
}
// get a user by userName
// just for internal use/helper at the moment
function findByUserName(userName) {
  return db("users")
    .where({ userName: userName })
    .first()
    .select("id", "userName");
}
// get a user by email
// just for internal use/helper at the moment
function findByEmail(email) {
  return db("users")
    .where({ email: email })
    .first()
    .select("id", "userName", "email");
}

// get user info (with password) by id, for internal use in the 'login' function below
// not exported
function getPersonalInfo(name) {
  return db("users")
    .where({ userName: name })
    .select("id", "userName", "password", "role_id");
}

// add a new user
async function register(user) {
  const {
    userName,
    password,
    email,
    salary,
    role_id,
    employment_info_id,
  } = user;
  // check if username or email already exists
  const userExists = await findByUserName(userName);
  const emailExists = await findByEmail(email);

  if (userExists) {
    return { Error: "User already exists" };
  }
  // check email is not already taken
  if (emailExists) {
    return { Error: "Email is already in use" };
  }

  // return 'id' on success,
  return db
    .insert({
      userName: userName,
      password: password,
      email: email,
      salary: salary,
      role_id: role_id,
      employment_info_id: employment_info_id,
    })
    .into("users")
    .returning("id");
}

// login
async function login(info) {
  const { userName } = info;
  const user = await getPersonalInfo(userName);
  // if user is found
  if (user.length) {
    return user[0];
  } else {
    // if user not found
    return null;
  }
}

// update a user
async function updateUser(info, curUserRoleId) {
  const { id, userName, email, salary, role_id, employment_info_id } = info;
  // query DB to see if username or email is already taken
  const name = await findByUserName(userName);
  const userEmail = await findByEmail(email);

  // if user does not exist
  if (!findById(id, curUserRoleId)) {
    return { Error: "That user does not exist" };
  }

  // check if NEW userName already exists
  if (name) {
    // and it's not the userName of the current user
    if (name.id !== parseInt(id)) {
      return { Error: "User name already exists" };
    }
  }

  // check if NEW email already exists
  if (userEmail) {
    // but it's not the email for the current user
    if (userEmail.id !== parseInt(id)) {
      return { Error: "Email already in use" };
    }
  }
  // returns user's "id" on success
  return db("users")
    .update({
      userName: userName,
      email: email,
      salary: salary,
      role_id: role_id,
      employment_info_id: employment_info_id
    })
    .where({ id: id })
    .returning("id");
}

async function deleteUser(id, role_id) {
  // check if user exists first
  const userCheck = await findById(id, role_id);

  if (userCheck) {
    // returns number of rows affected on success
    return db("users").where({ id: id }).del();
  } else {
    return { Error: "That user does not exist." };
  }
}