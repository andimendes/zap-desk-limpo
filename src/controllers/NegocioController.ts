import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CreateNegocioService from "../services/NegocioService/CreateNegocioService";
import ListNegociosService from "../services/NegocioService/ListNegociosService";
import UpdateNegocioService from "../services/NegocioService/UpdateNegocioService";
import ShowNegocioService from "../services/NegocioService/ShowNegocioService";
import DeleteNegocioService from "../services/NegocioService/DeleteNegocioService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { negocios, count, hasMore } = await ListNegociosService({
    searchParam,
    pageNumber
  });

  return res.json({ negocios, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { title, value, pipe, stage, empresaId, contatoId } = req.body;
  const { id: userId } = req.user;

  const negocio = await CreateNegocioService({
    title,
    value,
    pipe,
    stage,
    empresaId,
    contatoId,
    userId
  });

  const io = getIO();
  io.emit("negocio", {
    action: "create",
    negocio
  });

  return res.status(200).json(negocio);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { negocioId } = req.params;

  const negocio = await ShowNegocioService(negocioId);

  return res.status(200).json(negocio);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { negocioId } = req.params;
  const negocioData = req.body;

  const negocio = await UpdateNegocioService({
    negocioData,
    negocioId
  });

  const io = getIO();
  io.emit("negocio", {
    action: "update",
    negocio
  });

  return res.status(200).json(negocio);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { negocioId } = req.params;

  await DeleteNegocioService(negocioId);

  const io = getIO();
  io.emit("negocio", {
    action: "delete",
    negocioId
  });

  return res.status(200).json({ message: "Negócio excluído" });
};