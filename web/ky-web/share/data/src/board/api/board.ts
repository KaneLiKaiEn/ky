import { request } from "comm/request";
import type * as Protocol from "../types/board.d.ts";

export const getBackgroundList = (params: Protocol.GetBackgroundListReq) =>
  request.post<Protocol.GetBackgroundListRes>(
    "board/GetBackgroundList",
    params,
  );

export const retrieveBackgroundList = (
  params: Protocol.RetrieveBackgroundListReq,
) =>
  request.post<Protocol.RetrieveBackgroundListRes>(
    "board/RetrieveBackgroundList",
    params,
  );

export const newBackground = (params: Protocol.NewBackgroundReq) =>
  request.post<Protocol.NewBackgroundRes>("board/NewBackground", params);

export const deleteBackground = (params: Protocol.DeleteBackgroundReq) =>
  request.post<Protocol.DeleteBackgroundRes>("board/DeleteBackground", params);

export const getBackgroundProperty = (
  params: Protocol.GetBackgroundPropertyReq,
) =>
  request.post<Protocol.GetBackgroundPropertyRes>(
    "board/GetBackgroundProperty",
    params,
  );

export const saveBackgroundProperty = (
  params: Protocol.SaveBackgroundPropertyReq,
) =>
  request.post<Protocol.SaveBackgroundPropertyRes>(
    "board/SaveBackgroundProperty",
    params,
  );

export const getBackgroundFile = (params: Protocol.GetBackgroundFileReq) =>
  request.post<Protocol.GetBackgroundFileRes>(
    "board/GetBackgroundFile",
    params,
  );

export const saveBackgroundFile = (params: Protocol.SaveBackgroundFileReq) =>
  request.post<Protocol.SaveBackgroundFileRes>(
    "board/SaveBackgroundFile",
    params,
  );

export const getBorderList = (params: Protocol.GetBorderListReq) =>
  request.post<Protocol.GetBorderListRes>("board/GetBorderList", params);

export const retrieveBorderList = (params: Protocol.RetrieveBorderListReq) =>
  request.post<Protocol.RetrieveBorderListRes>(
    "board/RetrieveBorderList",
    params,
  );

export const newBorder = (params: Protocol.NewBorderReq) =>
  request.post<Protocol.NewBorderRes>("board/NewBorder", params);

export const deleteBorder = (params: Protocol.DeleteBorderReq) =>
  request.post<Protocol.DeleteBorderRes>("board/DeleteBorder", params);

export const getBorderProperty = (params: Protocol.GetBorderPropertyReq) =>
  request.post<Protocol.GetBorderPropertyRes>(
    "board/GetBorderProperty",
    params,
  );

export const saveBorderProperty = (params: Protocol.SaveBorderPropertyReq) =>
  request.post<Protocol.SaveBorderPropertyRes>(
    "board/SaveBorderProperty",
    params,
  );

export const getBorderDefList = (params: Protocol.GetBorderDefListReq) =>
  request.post<Protocol.GetBorderDefListRes>("board/GetBorderDefList", params);

export const saveBorderDefList = (params: Protocol.SaveBorderDefListReq) =>
  request.post<Protocol.SaveBorderDefListRes>(
    "board/SaveBorderDefList",
    params,
  );

export const getBorderFile = (params: Protocol.GetBorderFileReq) =>
  request.post<Protocol.GetBorderFileRes>("board/GetBorderFile", params);

export const saveBorderFile = (params: Protocol.SaveBorderFileReq) =>
  request.post<Protocol.SaveBorderFileRes>("board/SaveBorderFile", params);

export const getBannerList = (params: Protocol.GetBannerListReq) =>
  request.post<Protocol.GetBannerListRes>("board/GetBannerList", params);

export const retrieveBannerList = (params: Protocol.RetrieveBannerListReq) =>
  request.post<Protocol.RetrieveBannerListRes>(
    "board/RetrieveBannerList",
    params,
  );

export const newBanner = (params: Protocol.NewBannerReq) =>
  request.post<Protocol.NewBannerRes>("board/NewBanner", params);

export const deleteBanner = (params: Protocol.DeleteBannerReq) =>
  request.post<Protocol.DeleteBannerRes>("board/DeleteBanner", params);

export const getBannerProperty = (params: Protocol.GetBannerPropertyReq) =>
  request.post<Protocol.GetBannerPropertyRes>(
    "board/GetBannerProperty",
    params,
  );

export const saveBannerProperty = (params: Protocol.SaveBannerPropertyReq) =>
  request.post<Protocol.SaveBannerPropertyRes>(
    "board/SaveBannerProperty",
    params,
  );

export const getBannerDefList = (params: Protocol.GetBannerDefListReq) =>
  request.post<Protocol.GetBannerDefListRes>("board/GetBannerDefList", params);

export const saveBannerDefList = (params: Protocol.SaveBannerDefListReq) =>
  request.post<Protocol.SaveBannerDefListRes>(
    "board/SaveBannerDefList",
    params,
  );

export const getBannerFile = (params: Protocol.GetBannerFileReq) =>
  request.post<Protocol.GetBannerFileRes>("board/GetBannerFile", params);

export const saveBannerFile = (params: Protocol.SaveBannerFileReq) =>
  request.post<Protocol.SaveBannerFileRes>("board/SaveBannerFile", params);

export const getComponentList = (params: Protocol.GetComponentListReq) =>
  request.post<Protocol.GetComponentListRes>("board/GetComponentList", params);

export const retrieveComponentList = (
  params: Protocol.RetrieveComponentListReq,
) =>
  request.post<Protocol.RetrieveComponentListRes>(
    "board/RetrieveComponentList",
    params,
  );

export const newComponent = (params: Protocol.NewComponentReq) =>
  request.post<Protocol.NewComponentRes>("board/NewComponent", params);

export const deleteComponent = (params: Protocol.DeleteComponentReq) =>
  request.post<Protocol.DeleteComponentRes>("board/DeleteComponent", params);

export const getComponentProperty = (
  params: Protocol.GetComponentPropertyReq,
) =>
  request.post<Protocol.GetComponentPropertyRes>(
    "board/GetComponentProperty",
    params,
  );

export const saveComponentProperty = (
  params: Protocol.SaveComponentPropertyReq,
) =>
  request.post<Protocol.SaveComponentPropertyRes>(
    "board/SaveComponentProperty",
    params,
  );

export const getComponentDefList = (params: Protocol.GetComponentDefListReq) =>
  request.post<Protocol.GetComponentDefListRes>(
    "board/GetComponentDefList",
    params,
  );

export const saveComponentDefList = (
  params: Protocol.SaveComponentDefListReq,
) =>
  request.post<Protocol.SaveComponentDefListRes>(
    "board/SaveComponentDefList",
    params,
  );

export const reviseComponent = (params: Protocol.ReviseComponentReq) =>
  request.post<Protocol.ReviseComponentRes>("board/ReviseComponent", params);

export const getComponentVarList = (params: Protocol.GetComponentVarListReq) =>
  request.post<Protocol.GetComponentVarListRes>(
    "board/GetComponentVarList",
    params,
  );

export const saveComponentVarList = (
  params: Protocol.SaveComponentVarListReq,
) =>
  request.post<Protocol.SaveComponentVarListRes>(
    "board/SaveComponentVarList",
    params,
  );

export const getComponentExtList = (params: Protocol.GetComponentExtListReq) =>
  request.post<Protocol.GetComponentExtListRes>(
    "board/GetComponentExtList",
    params,
  );

export const saveComponentExtList = (
  params: Protocol.SaveComponentExtListReq,
) =>
  request.post<Protocol.SaveComponentExtListRes>(
    "board/SaveComponentExtList",
    params,
  );

export const getComponentThumbnail = (
  params: Protocol.GetComponentThumbnailReq,
) =>
  request.post<Protocol.GetComponentThumbnailRes>(
    "board/GetComponentThumbnail",
    params,
  );

export const saveComponentThumbnail = (
  params: Protocol.SaveComponentThumbnailReq,
) =>
  request.post<Protocol.SaveComponentThumbnailRes>(
    "board/SaveComponentThumbnail",
    params,
  );

export const testComponent = (params: Protocol.TestComponentReq) =>
  request.post<Protocol.TestComponentRes>("board/TestComponent", params);

export const getBoardList = (params: Protocol.GetBoardListReq) =>
  request.post<Protocol.GetBoardListRes>("board/GetBoardList", params);

export const retrieveBoardList = (params: Protocol.RetrieveBoardListReq) =>
  request.post<Protocol.RetrieveBoardListRes>(
    "board/RetrieveBoardList",
    params,
  );

export const newBoard = (params: Protocol.NewBoardReq) =>
  request.post<Protocol.NewBoardRes>("board/NewBoard", params);

export const deleteBoard = (params: Protocol.DeleteBoardReq) =>
  request.post<Protocol.DeleteBoardRes>("board/DeleteBoard", params);

export const getBoardProperty = (params: Protocol.GetBoardPropertyReq) =>
  request.post<Protocol.GetBoardPropertyRes>("board/GetBoardProperty", params);

export const saveBoardProperty = (params: Protocol.SaveBoardPropertyReq) =>
  request.post<Protocol.SaveBoardPropertyRes>(
    "board/SaveBoardProperty",
    params,
  );

export const getBoardLayout = (params: Protocol.GetBoardLayoutReq) =>
  request.post<Protocol.GetBoardLayoutRes>("board/GetBoardLayout", params);

export const saveBoardLayout = (params: Protocol.SaveBoardLayoutReq) =>
  request.post<Protocol.SaveBoardLayoutRes>("board/SaveBoardLayout", params);

export const getBoardAuthList = (params: Protocol.GetBoardAuthListReq) =>
  request.post<Protocol.GetBoardAuthListRes>("board/GetBoardAuthList", params);

export const saveBoardAuthList = (params: Protocol.SaveBoardAuthListReq) =>
  request.post<Protocol.SaveBoardAuthListRes>(
    "board/SaveBoardAuthList",
    params,
  );

export const getBoardComponentList = (
  params: Protocol.GetBoardComponentListReq,
) =>
  request.post<Protocol.GetBoardComponentListRes>(
    "board/GetBoardComponentList",
    params,
  );

export const addBoardComponent = (params: Protocol.AddBoardComponentReq) =>
  request.post<Protocol.AddBoardComponentRes>(
    "board/AddBoardComponent",
    params,
  );

export const removeBoardComponent = (
  params: Protocol.RemoveBoardComponentReq,
) =>
  request.post<Protocol.RemoveBoardComponentRes>(
    "board/RemoveBoardComponent",
    params,
  );

export const getBoardComponentProperty = (
  params: Protocol.GetBoardComponentPropertyReq,
) =>
  request.post<Protocol.GetBoardComponentPropertyRes>(
    "board/GetBoardComponentProperty",
    params,
  );

export const saveBoardComponentProperty = (
  params: Protocol.SaveBoardComponentPropertyReq,
) =>
  request.post<Protocol.SaveBoardComponentPropertyRes>(
    "board/SaveBoardComponentProperty",
    params,
  );

export const getBoardComponentDefList = (
  params: Protocol.GetBoardComponentDefListReq,
) =>
  request.post<Protocol.GetBoardComponentDefListRes>(
    "board/GetBoardComponentDefList",
    params,
  );

export const saveBoardComponentDefList = (
  params: Protocol.SaveBoardComponentDefListReq,
) =>
  request.post<Protocol.SaveBoardComponentDefListRes>(
    "board/SaveBoardComponentDefList",
    params,
  );

export const getBoardComponentExtList = (
  params: Protocol.GetBoardComponentExtListReq,
) =>
  request.post<Protocol.GetBoardComponentExtListRes>(
    "board/GetBoardComponentExtList",
    params,
  );

export const saveBoardComponentExtList = (
  params: Protocol.SaveBoardComponentExtListReq,
) =>
  request.post<Protocol.SaveBoardComponentExtListRes>(
    "board/SaveBoardComponentExtList",
    params,
  );

export const getBoardComponentVarList = (
  params: Protocol.GetBoardComponentVarListReq,
) =>
  request.post<Protocol.GetBoardComponentVarListRes>(
    "board/GetBoardComponentVarList",
    params,
  );

export const saveBoardComponentVarList = (
  params: Protocol.SaveBoardComponentVarListReq,
) =>
  request.post<Protocol.SaveBoardComponentVarListRes>(
    "board/SaveBoardComponentVarList",
    params,
  );

export const getBoardComponentColList = (
  params: Protocol.GetBoardComponentColListReq,
) =>
  request.post<Protocol.GetBoardComponentColListRes>(
    "board/GetBoardComponentColList",
    params,
  );

export const saveBoardComponentColList = (
  params: Protocol.SaveBoardComponentColListReq,
) =>
  request.post<Protocol.SaveBoardComponentColListRes>(
    "board/SaveBoardComponentColList",
    params,
  );

export const getBoardComponentColThresholdList = (
  params: Protocol.GetBoardComponentColThresholdListReq,
) =>
  request.post<Protocol.GetBoardComponentColThresholdListRes>(
    "board/GetBoardComponentColThresholdList",
    params,
  );

export const saveBoardComponentColThresholdList = (
  params: Protocol.SaveBoardComponentColThresholdListReq,
) =>
  request.post<Protocol.SaveBoardComponentColThresholdListRes>(
    "board/SaveBoardComponentColThresholdList",
    params,
  );

export const getBoardArgList = (params: Protocol.GetBoardArgListReq) =>
  request.post<Protocol.GetBoardArgListRes>("board/GetBoardArgList", params);

export const buildBoardComponent = (params: Protocol.BuildBoardComponentReq) =>
  request.post<Protocol.BuildBoardComponentRes>(
    "board/BuildBoardComponent",
    params,
  );

export const retrieveTitleList = (params: Protocol.RetrieveTitleListReq) =>
  request.post<Protocol.RetrieveTitleListRes>(
    "board/RetrieveTitleList",
    params,
  );

export const getTitleProperty = (params: Protocol.GetTitlePropertyReq) =>
  request.post<Protocol.GetTitlePropertyRes>("board/GetTitleProperty", params);

export const getBoardLinkList = (params: Protocol.GetBoardLinkListReq) =>
  request.post<Protocol.GetBoardLinkListRes>("board/GetBoardLinkList", params);

export const saveBoardLinkList = (params: Protocol.SaveBoardLinkListReq) =>
  request.post<Protocol.SaveBoardLinkListRes>(
    "board/SaveBoardLinkList",
    params,
  );

export const getMyCatalogList = (params: Protocol.GetMyCatalogListReq) =>
  request.post<Protocol.GetMyCatalogListRes>("board/GetMyCatalogList", params);
export const getMyBoardList = (params: Protocol.GetMyBoardListReq) =>
  request.post<Protocol.GetMyBoardListRes>("board/GetMyBoardList", params);
export const countBoardComponentVarValue = (
  params: Protocol.CountBoardComponentVarValueReq,
) =>
  request.post<Protocol.CountBoardComponentVarValueRes>(
    "board/CountBoardComponentVarValue",
    params,
  );
export const getBoardComponentVarValue = (
  params: Protocol.GetBoardComponentVarValueReq,
) =>
  request.post<Protocol.GetBoardComponentVarValueRes>(
    "board/GetBoardComponentVarValue",
    params,
  );
