"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    port;
    express;
    server;
    static facade;
    constructor(port) {
        console.info(`Server::<init>( ${port} )`);
        this.port = port;
        this.express = (0, express_1.default)();
        Server.facade = new InsightFacade_1.default();
        this.registerMiddleware();
        this.registerRoutes();
        this.express.use(express_1.default.static("./frontend/public"));
    }
    start() {
        return new Promise((resolve, reject) => {
            console.info("Server::start() - start");
            if (this.server !== undefined) {
                console.error("Server::start() - server already listening");
                reject();
            }
            else {
                this.server = this.express.listen(this.port, () => {
                    console.info(`Server::start() - server listening on port: ${this.port}`);
                    resolve();
                }).on("error", (err) => {
                    console.error(`Server::start() - server ERROR: ${err.message}`);
                    reject(err);
                });
            }
        });
    }
    stop() {
        console.info("Server::stop()");
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                console.error("Server::stop() - ERROR: server not started");
                reject();
            }
            else {
                this.server.close(() => {
                    console.info("Server::stop() - server closed");
                    resolve();
                });
            }
        });
    }
    registerMiddleware() {
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.raw({ type: "application/*", limit: "10mb" }));
        this.express.use((0, cors_1.default)());
    }
    registerRoutes() {
        this.express.get("/echo/:msg", Server.echo);
        this.express.put("/dataset/:id/:kind", Server.addDataset);
        this.express.post("/query", Server.performQuery);
        this.express.delete("/dataset/:id", Server.removeDataset);
        this.express.get("/datasets", Server.listDatasets);
    }
    static async removeDataset(req, res) {
        try {
            let id = req.params.id;
            let response = await Server.facade.removeDataset(id);
            res.status(200).json({ result: response });
        }
        catch (err) {
            if (err instanceof IInsightFacade_1.NotFoundError) {
                res.status(404).json({ error: err.message });
            }
            else {
                res.status(400).json({ error: err.message });
            }
        }
    }
    static async listDatasets(req, res) {
        try {
            let response = await Server.facade.listDatasets();
            res.status(200).json({ result: response });
        }
        catch (err) {
            console.log("we fucked up:", err.message);
        }
    }
    static async performQuery(req, res) {
        try {
            let query = JSON.parse(JSON.stringify(req.body));
            let response = await Server.facade.performQuery(query);
            res.status(200).json({ result: response });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async addDataset(req, res) {
        try {
            let id = req.params.id;
            let content = req.body.toString("base64");
            let kind = req.params.kind;
            let insightKind = IInsightFacade_1.InsightDatasetKind.Sections;
            if (kind === "rooms") {
                insightKind = IInsightFacade_1.InsightDatasetKind.Rooms;
            }
            else if (kind === "sections") {
                insightKind = IInsightFacade_1.InsightDatasetKind.Sections;
            }
            let response = await Server.facade.addDataset(id, content, insightKind);
            res.status(200).json({ result: response });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static echo(req, res) {
        try {
            console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performEcho(req.params.msg);
            res.status(200).json({ result: response });
        }
        catch (err) {
            res.status(400).json({ error: err });
        }
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map