import auth from "@feathersjs/authentication-client"
import { feathers } from "@feathersjs/feathers"
import rest from "@feathersjs/rest-client"

const app = feathers()

const restClient = rest("https://cloud.privatefolio.app")
// const restClient = rest("http://localhost:4004")

app.configure(restClient.fetch(window.fetch.bind(window)))
app.configure(auth({ storage: window.localStorage }))

export { app }
