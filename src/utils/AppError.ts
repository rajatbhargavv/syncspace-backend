class AppError extends Error{
    statusCode:number
    constructor(message:string,statusCode:number){
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.statusCode=statusCode;
        this.name=this.constructor.name;
    }
}
export default AppError;