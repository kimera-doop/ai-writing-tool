"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { encryptText, decryptText } from "@/lib/crypto";
import {
  ENC_GEMINI_STORAGE,
  ENC_NOTION_STORAGE,
  hasEncryptedKeys,
  setInMemoryGeminiKey,
  setInMemoryNotionToken,
} from "@/lib/clientKeys";

interface KeysContextValue {
  masterPassword: string | null;
  isLocked: boolean;
  hasEncKeys: boolean;
  geminiKeySet: boolean;
  notionTokenSet: boolean;
  unlock: (password: string) => Promise<boolean>;
  initMasterPassword: (password: string) => void;
  saveGeminiKey: (key: string) => Promise<void>;
  saveNotionToken: (token: string) => Promise<void>;
  removeGeminiKey: () => void;
  removeNotionToken: () => void;
}

const KeysContext = createContext<KeysContextValue | null>(null);

// sessionStorage キー（タブを閉じると消える）
const SESSION_MASTER = "session_master_pw";

export function KeysProvider({ children }: { children: ReactNode }) {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [hasEncKeys, setHasEncKeys] = useState(false);
  const [geminiKeySet, setGeminiKeySet] = useState(false);
  const [notionTokenSet, setNotionTokenSet] = useState(false);

  useEffect(() => {
    const has = hasEncryptedKeys();
    setHasEncKeys(has);
    setGeminiKeySet(!!localStorage.getItem(ENC_GEMINI_STORAGE));
    setNotionTokenSet(!!localStorage.getItem(ENC_NOTION_STORAGE));

    // 外部サイトから戻った後など、sessionStorageにパスワードが残っていれば自動復元
    if (has) {
      const savedPw = sessionStorage.getItem(SESSION_MASTER);
      if (savedPw) {
        (async () => {
          try {
            const encGemini = localStorage.getItem(ENC_GEMINI_STORAGE);
            const encNotion = localStorage.getItem(ENC_NOTION_STORAGE);
            if (encGemini) setInMemoryGeminiKey(await decryptText(encGemini, savedPw));
            if (encNotion) setInMemoryNotionToken(await decryptText(encNotion, savedPw));
            setMasterPassword(savedPw);
          } catch {
            // パスワードが無効なら sessionStorage を削除
            sessionStorage.removeItem(SESSION_MASTER);
          }
        })();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 暗号化キーが存在するがパスワードが未入力の状態 = ロック中
  const isLocked = hasEncKeys && masterPassword === null;

  /** マスターパスワードでlocalStorage内の暗号化キーを復号してメモリにロード */
  const unlock = async (password: string): Promise<boolean> => {
    try {
      const encGemini = localStorage.getItem(ENC_GEMINI_STORAGE);
      const encNotion = localStorage.getItem(ENC_NOTION_STORAGE);
      if (encGemini) {
        const key = await decryptText(encGemini, password);
        setInMemoryGeminiKey(key);
      }
      if (encNotion) {
        const token = await decryptText(encNotion, password);
        setInMemoryNotionToken(token);
      }
      setMasterPassword(password);
      sessionStorage.setItem(SESSION_MASTER, password);
      return true;
    } catch {
      setInMemoryGeminiKey(null);
      setInMemoryNotionToken(null);
      sessionStorage.removeItem(SESSION_MASTER);
      return false;
    }
  };

  /** 初回設定時：新しいマスターパスワードをメモリに保持 */
  const initMasterPassword = (password: string) => {
    setMasterPassword(password);
    sessionStorage.setItem(SESSION_MASTER, password);
  };

  const saveGeminiKey = async (key: string) => {
    if (!masterPassword) throw new Error("マスターパスワードが設定されていません");
    const encrypted = await encryptText(key, masterPassword);
    localStorage.setItem(ENC_GEMINI_STORAGE, encrypted);
    setInMemoryGeminiKey(key);
    setGeminiKeySet(true);
    setHasEncKeys(true);
  };

  const saveNotionToken = async (token: string) => {
    if (!masterPassword) throw new Error("マスターパスワードが設定されていません");
    const encrypted = await encryptText(token, masterPassword);
    localStorage.setItem(ENC_NOTION_STORAGE, encrypted);
    setInMemoryNotionToken(token);
    setNotionTokenSet(true);
    setHasEncKeys(true);
  };

  const removeGeminiKey = () => {
    localStorage.removeItem(ENC_GEMINI_STORAGE);
    setInMemoryGeminiKey(null);
    setGeminiKeySet(false);
    if (!localStorage.getItem(ENC_NOTION_STORAGE)) {
      setHasEncKeys(false);
      sessionStorage.removeItem(SESSION_MASTER);
    }
  };

  const removeNotionToken = () => {
    localStorage.removeItem(ENC_NOTION_STORAGE);
    setInMemoryNotionToken(null);
    setNotionTokenSet(false);
    if (!localStorage.getItem(ENC_GEMINI_STORAGE)) {
      setHasEncKeys(false);
      sessionStorage.removeItem(SESSION_MASTER);
    }
  };

  return (
    <KeysContext.Provider
      value={{
        masterPassword,
        isLocked,
        hasEncKeys,
        geminiKeySet,
        notionTokenSet,
        unlock,
        initMasterPassword,
        saveGeminiKey,
        saveNotionToken,
        removeGeminiKey,
        removeNotionToken,
      }}
    >
      {children}
    </KeysContext.Provider>
  );
}

export function useKeys() {
  const ctx = useContext(KeysContext);
  if (!ctx) throw new Error("useKeys must be used within KeysProvider");
  return ctx;
}
