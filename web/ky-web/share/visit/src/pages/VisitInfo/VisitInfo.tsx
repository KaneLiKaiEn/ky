import { useEffect, useState } from "react";
import { Progress, Spin, Tag } from "antd";
import dayjs from "dayjs";
import { CloseOutlined } from "@ant-design/icons";
import { getAccountAPI } from "@/api/account";
import { getBillAccountAPI } from "@/api/bill";
import { fetchVisitInfoById } from "./fetch";
import type { VisitInfoProps, VisitInfoRow, VisitStatusRow } from "./types";
import AllergyHistory from "../AllergyHistory";

export type { VisitInfoProps } from "./types";

export /** 按医保类型 / 结算身份生成展示 Tag */
const getInsuranceTagInfo = (
  data?: VisitStatusRow | null,
): InsuranceTagInfo | null => {
  if (!data) return null;

  const insuranceType = data.insurance_type;
  const settleTag = data.settle_tag ? `【${data.settle_note ?? ""}】` : "";

  // 代表自费
  if (Number(insuranceType) === 0) {
    return {
      color: "blue",
      text: `自费${settleTag}`,
    };
  }

  // 代表是医保，但是身份是自费
  if (Number(data.settle_type) === 0) {
    return {
      color: "purple",
      text: "【自费】",
    };
  }

  // 代表是医保
  const text = `${data.service_name ?? ""}${
    data.service_note ? `（${data.service_note}）` : ""
  }`;
  if (!text) return null;

  return {
    color: "cyan",
    text,
  };
};

const parseAmount = (value?: string | number | null): number => {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatAmount = (value: number): string => value.toFixed(2);

type InsuranceTagInfo = {
  color: string;
  text: string;
};

type PrepayExpressionDisplay = {
  negative: boolean;
  totalPrepay: number;
  // deposit: number;
  guarantee: number;
  totalSpend: number;
  balance: number;
  credit: number;
  hasGuarantee: boolean;
  hasCredit: boolean;
};

const AmountPart = ({
  amount,
  title,
}: {
  amount: number;
  title: string;
}) => (
  <span title={title}>¥{formatAmount(amount)}</span>
);

/** 预交金表达式：总充值预交金 - 总花费 = 预交金余额（有担保额时拆分为押金+担保额） */
const PrepayExpressionTag = ({
  visitId,
  orgId: orgIdProp,
}: {
  visitId: number;
  orgId?: number;
}) => {
  const [display, setDisplay] = useState<PrepayExpressionDisplay | null>(null);

  useEffect(() => {
    if (!Number.isFinite(visitId) || visitId <= 0) {
      setDisplay(null);
      return;
    }

    let cancelled = false;
    setDisplay(null);

    const load = async () => {
      try {
        const [billRes, accountRes] = await Promise.all([
          getBillAccountAPI({
            visit_id: visitId,
            bill_type: "*",
          }),
          getAccountAPI({
            visit_id: visitId,
            include_prepay: true,
            include_credit: true,
            include_guarantee: true,
          }),
        ]);

        if (cancelled) return;

        const guarantee = parseAmount(accountRes.guarantee_amount);
        const hasGuarantee = guarantee > 0;
        const prepayAmount = parseAmount(accountRes.prepay_amount);

        // 总花费 = 已扣费
        const totalSpend = parseAmount(billRes.charge_amount);
        // 预交金余额
        const balance = parseAmount(hasGuarantee ? guarantee + prepayAmount : prepayAmount);
        // 总充值预交金(押金) = 余额(注意是 prepay_amount 不是 balance) + 总花费
        const totalPrepay = prepayAmount + totalSpend;
        const creditRaw = accountRes.credit_amount?.trim();
        const hasCredit = creditRaw != null && creditRaw !== "" && creditRaw !== "0";
        const credit = hasCredit ? parseAmount(creditRaw) : 0;

        setDisplay({
          negative: balance < 0,
          totalPrepay,
          guarantee,
          totalSpend,
          balance,
          credit,
          hasGuarantee,
          hasCredit,
        });
      } catch {
        if (!cancelled) setDisplay(null);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [visitId, orgIdProp]);

  if (!display) return null;

  const {
    negative,
    totalPrepay,
    guarantee,
    totalSpend,
    balance,
    credit,
    hasGuarantee,
    hasCredit,
  } = display;

  return (
    <Tag
      className="m-0! shrink-0 px-2! text-(length:--app-theme-font-default)!"
      variant="solid"
      color={negative ? "volcano" : "success"}
    >
      {hasGuarantee ? (
        <>
          <AmountPart amount={totalPrepay} title="押金" />
          {" + "}
          <AmountPart amount={guarantee} title="担保额" />
        </>
      ) : (
        <AmountPart amount={totalPrepay} title="总充值预交金" />
      )}
      {" - "}
      <AmountPart amount={totalSpend} title="费用" />
      {" = "}
      <AmountPart amount={balance} title="余额" />
      {hasCredit ? (
        <>
          {" ("}
          <AmountPart amount={credit} title="信用额" />
          {")"}
        </>
      ) : null}
    </Tag>
  );
};

const VisitInfo = ({
  data,
  visitId,
  loading: loadingProp = false,
  error: errorProp = null,
  onClose,
  onLoad,
  className,
}: VisitInfoProps) => {
  const hasData = data != null;
  const [fetched, setFetched] = useState<VisitInfoRow | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // data 优先：有外部数据时不请求
    if (hasData) {
      setFetched(null);
      setFetching(false);
      setFetchError(null);
      return;
    }

    const id = Number(visitId);
    // Number.isFinite() 用来判断一个值是不是一个有限的数字,也就是说，它要求同时满足：
    // 1. 类型必须是 number
    // 2. 不能是 Infinity
    // 3. 不能是 -Infinity
    // 4. 不能是 NaN
    if (!Number.isFinite(id) || id <= 0) {
      setFetched(null);
      setFetching(false);
      setFetchError(null);
      return;
    }

    // cancelled 是 异步请求的取消标记，用来避免「过期请求」把结果写回已经不需要它的组件
    // 典型场景：
    // visitId 从 100 变成 200，effect 清理旧请求，再发起新请求
    // 若 100 的请求更晚才返回，没有标记就会误用旧数据覆盖新状态
    // 注意:这个 cancelled 是闭包,每次 visitId 依赖变化的时候,会执行 cleanup 函数,设置当前 闭包下 的 cancelled 为 true
    // 然后再次执行 useEffect 监听函数，生成新的 cancelled 闭包，再去执行请求数据和判断的逻辑
    let cancelled = false;

    const load = async () => {
      setFetching(true);
      setFetchError(null);
      try {
        const row = await fetchVisitInfoById(id);
        if (cancelled) return;
        if (!row) {
          setFetched(null);
          setFetchError("未找到该就诊记录");
          return;
        }
        setFetched(row);
        // 调用 onLoad 回调函数，将数据写入 store
        onLoad?.(row);
      } catch {
        if (!cancelled) {
          setFetched(null);
          setFetchError("加载患者信息失败");
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [hasData, visitId]);

  const visitInfo = hasData ? data : fetched;
  const loading = hasData ? loadingProp : fetching;
  const error = hasData ? errorProp : fetchError;

  if (loading && !visitInfo) {
    return (
      <div
        className={[
          "header-container flex h-8 shrink-0 items-center border-b border-(--app-theme-border) px-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Spin size="small" />
        <span className="ms-2 text-[12px]">
          加载患者信息…
        </span>
      </div>
    );
  }

  if (error && !visitInfo) {
    return (
      <div
        className={[
          "header-container flex h-8 shrink-0 items-center justify-between border-b border-(--app-theme-border) px-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="text-[12px] text-(--app-theme-text-secondary)">
          {error}
        </span>
        <span
          className="
            cursor-pointer
            select-none
            text-(--app-theme-primary)
            hover:underline
            text-(length:--app-theme-font-sm)
          "
          onClick={onClose}
        >
          关闭
        </span>
      </div>
    );
  }

  if (!visitInfo) return null;

  const admissionText = visitInfo.admission_time
    ? dayjs(visitInfo.admission_time).format("YYYY-MM-DD HH:mm")
    : "-";
  const insuranceTag = getInsuranceTagInfo(visitInfo.status_property);

  return (
    <div
      className={[
        "header-container flex justify-center! py-1 shrink-0 gap-2 overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="shrink-0 rounded font-bold text-white">
        {visitInfo.visit_property?.visit_info || "-"}
      </span>

      <AllergyHistory patientId={visitInfo.patient_id} />

      <div className="h-full flex min-w-0 items-center gap-2 overflow-hidden border-s border-(--app-theme-border)">
        {insuranceTag ? (
          <Tag
            className="m-0! shrink-0 text-(length:--app-theme-font-default)!"
            variant="solid"
            color={insuranceTag.color}
          >
            {insuranceTag.text}
          </Tag>
        ) : null}
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-(--app-theme-text-secondary)">入院:</span>
          <span className="font-bold text-white">
            {admissionText}
          </span>
        </div>
        {/* 预交金表达式：押金(+担保额)-费用=余额(信用额) */}
        <PrepayExpressionTag
          visitId={visitInfo.visit_id}
          orgId={visitInfo.visit_property?.org_id}
        />
      </div>


      {/* <CloseOutlined
        onClick={onClose}
      /> */}
    </div>
  );
};

export default VisitInfo;
