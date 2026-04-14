import { onRequestOptions as __api_contact_js_onRequestOptions } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\contact.js"
import { onRequestPost as __api_contact_js_onRequestPost } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\contact.js"
import { onRequestPost as __api_jobs_create_js_onRequestPost } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\jobs-create.js"
import { onRequestOptions as __api_leads_create_js_onRequestOptions } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\leads-create.js"
import { onRequestPost as __api_leads_create_js_onRequestPost } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\leads-create.js"
import { onRequestDelete as __api_leads_delete_js_onRequestDelete } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\leads-delete.js"
import { onRequestOptions as __api_leads_delete_js_onRequestOptions } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\leads-delete.js"
import { onRequestGet as __api_leads_list_js_onRequestGet } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\leads-list.js"
import { onRequestOptions as __api_leads_list_js_onRequestOptions } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\leads-list.js"
import { onRequestOptions as __api_leads_update_js_onRequestOptions } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\leads-update.js"
import { onRequestPut as __api_leads_update_js_onRequestPut } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\leads-update.js"
import { onRequestPost as __api_payments_create_link_js_onRequestPost } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\payments-create-link.js"
import { onRequestPost as __api_photos_upload_js_onRequestPost } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\photos-upload.js"
import { onRequestPost as __api_quotes_create_js_onRequestPost } from "D:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\functions\\api\\quotes-create.js"

export const routes = [
    {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_contact_js_onRequestOptions],
    },
  {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_contact_js_onRequestPost],
    },
  {
      routePath: "/api/jobs-create",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_jobs_create_js_onRequestPost],
    },
  {
      routePath: "/api/leads-create",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_leads_create_js_onRequestOptions],
    },
  {
      routePath: "/api/leads-create",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_leads_create_js_onRequestPost],
    },
  {
      routePath: "/api/leads-delete",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_leads_delete_js_onRequestDelete],
    },
  {
      routePath: "/api/leads-delete",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_leads_delete_js_onRequestOptions],
    },
  {
      routePath: "/api/leads-list",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_leads_list_js_onRequestGet],
    },
  {
      routePath: "/api/leads-list",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_leads_list_js_onRequestOptions],
    },
  {
      routePath: "/api/leads-update",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_leads_update_js_onRequestOptions],
    },
  {
      routePath: "/api/leads-update",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_leads_update_js_onRequestPut],
    },
  {
      routePath: "/api/payments-create-link",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_payments_create_link_js_onRequestPost],
    },
  {
      routePath: "/api/photos-upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_photos_upload_js_onRequestPost],
    },
  {
      routePath: "/api/quotes-create",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_quotes_create_js_onRequestPost],
    },
  ]