class customError extends Error {
  constructor(errObj) {
    super(errObj);
    console.log("errObj", errObj);
    this.name = JSON.parse(errObj).name;
    this.code = JSON.parse(errObj).code;
    this.msg = JSON.parse(errObj).msg;
    this.success = JSON.parse(errObj).success;
  }
}

module.exports = customError;
