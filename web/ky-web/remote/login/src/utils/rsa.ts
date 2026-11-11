import { JSEncrypt } from "jsencrypt";

// 对应私钥配置在后端 agileboot-infrastructure 的 application-basic.yml（agileboot.rsaPrivateKey）
const PUBLIC_KEY =
  "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCh6HkK+rCM37FAzCHVythTc6pxvr551K07CRhdX/NjCddHAuQMOd/57R5fiIwgVNEfCsD1cIyS6A8IWj4DtJLR2t29JehPpqiFSJ4hNtDcLNxNJiYRcCQvyMQeyQIPE5Ljc35c72YwDtQAsIJChsauyLrc+E6HC3gn1JDm18HNXwIDAQAB";

export function rsaEncrypt(text: string): string {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(PUBLIC_KEY);
  const encrypted = encryptor.encrypt(text);
  if (typeof encrypted !== "string") {
    throw new Error("密码加密失败");
  }
  return encrypted;
}
