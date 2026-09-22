import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiResponse } from "../../types/apiResponse";

export const sendResponse = <T>(
  c: Context,
  status: ContentfulStatusCode,
  message: string,
  data?: T,
) => {
  const payload: ApiResponse<T> = {
    message,
    data: data !== undefined ? data : null,
  };
  return c.json(payload, status);
};

export const responseOK = <T>(
  c: Context,
  message: string = "Success",
  data?: T,
) => {
  return sendResponse(c, 200, message, data);
};

export const responseCreated = <T>(
  c: Context,
  message: string = "Created successfully",
  data?: T,
) => {
  return sendResponse(c, 201, message, data);
};

export const responseBadRequest = (
  c: Context,
  message: string = "Bad request",
) => {
  return sendResponse(c, 400, message);
};

export const responseNotFound = (c: Context, message: string = "Not found") => {
  return sendResponse(c, 404, message);
};

export const responseUnauthorized = (
  c: Context,
  message: string = "Unauthorized",
) => {
  return sendResponse(c, 401, message);
};

export const responseForbidden = (
  c: Context,
  message: string = "Forbidden",
) => {
  return sendResponse(c, 403, message);
};

export const responseConflict = (c: Context, message: string = "Conflict") => {
  return sendResponse(c, 409, message);
};

/**
 * `423 Locked` — dipakai saat akun dikunci karena terlalu banyak percobaan
 * masuk yang gagal. Statusnya dibedakan dari `401` supaya klien bisa
 * membedakan "password salah, coba lagi" dari "berhenti mencoba, hubungi
 * admin" tanpa membaca teks pesannya.
 */
export const responseLocked = (c: Context, message: string = "Locked") => {
  return sendResponse(c, 423, message);
};

export const responseInternalError = (
  c: Context,
  message: string = "Internal server error",
) => {
  return sendResponse(c, 500, message);
};
