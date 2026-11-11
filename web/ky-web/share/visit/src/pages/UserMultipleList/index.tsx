import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input, Modal, Select, Space, Transfer } from "antd";
import type { TransferProps } from "antd";
import debounce from "lodash/debounce";
import { getSessionInfo } from "@/api/auth";
import { retrieveDeptList } from "@/api/org";
import { getUserList, retrieveUserList } from "@/api/user";
import type { UserRow } from "@/types/user";
import type { DeptRow } from "@/types/org";
import { getSessionId } from "comm/session";

export type SelectedUser = Pick<
  UserRow,
  "user_id" | "user_name" | "dept_id" | "dept_name" | "work_level"
>;

export type SelectedDept = Pick<
  DeptRow,
  "dept_id" | "dept_name"
>;

interface TransferItem {
  key: string;
  title: string;
  user: SelectedUser;
}

export interface UserMultipleListProps {
  open: boolean;
  value?: SelectedUser[];
  title?: string;
  onCancel: () => void;
  onOk: (users: SelectedUser[], dept: SelectedDept) => void;
}

const LEFT_PANEL_WIDTH = 280;

const getUserListCacheKey = (orgId?: number, deptId?: number) =>
  `${orgId != null && orgId > 0 ? orgId : 0}:${deptId != null && deptId > 0 ? deptId : 0}`;

const toTransferItem = (user: SelectedUser): TransferItem | null => {
  if (user.user_id == null) return null;
  const name = user.user_name?.trim() || String(user.user_id);
  return {
    key: String(user.user_id),
    title: user.work_level ? `${name}（${user.work_level}）` : name,
    user: {
      user_id: user.user_id,
      user_name: user.user_name,
      dept_id: user.dept_id,
      dept_name: user.dept_name,
      work_level: user.work_level,
    },
  };
};

const UserMultipleList: React.FC<UserMultipleListProps> = ({
  open,
  value = [],
  title = "选择人员",
  onCancel,
  onOk,
}) => {
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [itemMap, setItemMap] = useState<Record<string, TransferItem>>({});
  const [searching, setSearching] = useState(false);
  const [nameKeyword, setNameKeyword] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>();
  const [deptOptions, setDeptOptions] = useState<DeptRow[]>([]);
  const [deptSearching, setDeptSearching] = useState(false);

  const searchSeqRef = useRef(0);
  const deptSearchSeqRef = useRef(0);
  const targetKeysRef = useRef<string[]>([]);
  const selectedDeptIdRef = useRef<number | undefined>(undefined);
  const orgIdRef = useRef<number | undefined>(undefined);
  const nameKeywordRef = useRef("");
  const userListCacheRef = useRef<Map<string, UserRow[]>>(new Map());
  const modalOpenRef = useRef(open);
  modalOpenRef.current = open;

  useEffect(() => {
    targetKeysRef.current = targetKeys;
  }, [targetKeys]);

  useEffect(() => {
    selectedDeptIdRef.current = selectedDeptId;
  }, [selectedDeptId]);

  useEffect(() => {
    nameKeywordRef.current = nameKeyword;
  }, [nameKeyword]);

  const keepSelectedItems = (
    prev: Record<string, TransferItem>,
  ): Record<string, TransferItem> => {
    const next: Record<string, TransferItem> = {};
    targetKeysRef.current.forEach((key) => {
      if (prev[key]) next[key] = prev[key];
    });
    return next;
  };

  const applyUserList = (users: UserRow[] | undefined) => {
    setItemMap((prev) => {
      const next = keepSelectedItems(prev);
      (users ?? []).forEach((user) => {
        const item = toTransferItem(user);
        if (item) next[item.key] = item;
      });
      return next;
    });
  };

  const searchUsers = async (input: string) => {
    const keyword = input.trim();
    const seq = ++searchSeqRef.current;
    const deptId = selectedDeptIdRef.current;
    const orgId = orgIdRef.current;
    const hasDept = deptId != null && deptId > 0;
    const hasOrg = orgId != null && orgId > 0;

    if (!keyword && !hasOrg && !hasDept) {
      setItemMap((prev) => keepSelectedItems(prev));
      return;
    }

    if (!keyword) {
      const cached = userListCacheRef.current.get(
        getUserListCacheKey(orgId, deptId),
      );
      if (cached) {
        applyUserList(cached);
        return;
      }
    }

    setSearching(true);
    try {
      if (keyword) {
        const res = await retrieveUserList({
          retrieve_input: keyword,
          ...(hasDept ? { dept_id: deptId } : {}),
        });
        if (seq !== searchSeqRef.current) return;
        applyUserList(res.user_list);
      } else {
        const cacheKey = getUserListCacheKey(orgId, deptId);
        const res = await getUserList({
          ...(hasOrg ? { org_id: orgId } : {}),
          ...(hasDept ? { dept_id: deptId } : {}),
        });
        const list = res.user_list ?? [];
        if (modalOpenRef.current) {
          userListCacheRef.current.set(cacheKey, list);
        }
        if (seq !== searchSeqRef.current) return;
        applyUserList(list);
      }
    } catch {
      if (seq !== searchSeqRef.current) return;
      setItemMap((prev) => keepSelectedItems(prev));
    } finally {
      if (seq === searchSeqRef.current) setSearching(false);
    }
  };

  useEffect(() => {
    if (!open) {
      userListCacheRef.current.clear();
      return;
    }

    const initialMap: Record<string, TransferItem> = {};
    const keys: string[] = [];
    value.forEach((user) => {
      const item = toTransferItem(user);
      if (!item) return;
      initialMap[item.key] = item;
      keys.push(item.key);
    });
    setItemMap(initialMap);
    setTargetKeys(keys);
    setNameKeyword("");
    nameKeywordRef.current = "";
    orgIdRef.current = undefined;

    let cancelled = false;
    void getSessionInfo({ session_id: getSessionId() ?? "" }).then((res) => {
      if (cancelled) return;
      const orgId = res.session_info?.org_id;
      orgIdRef.current = orgId != null && orgId > 0 ? orgId : undefined;
      const deptId = res.session_info?.dept_id;
      const deptName = res.session_info?.dept_name?.trim();
      if (deptId != null && deptId > 0) {
        setSelectedDeptId(deptId);
        selectedDeptIdRef.current = deptId;
        setDeptOptions([
          {
            dept_id: deptId,
            dept_name: deptName || String(deptId),
          },
        ]);
      } else {
        setSelectedDeptId(undefined);
        selectedDeptIdRef.current = undefined;
        setDeptOptions([]);
      }
      void searchUsers("");
    });

    return () => {
      cancelled = true;
    };
    // 仅在弹窗打开时用当前 value 初始化，避免父组件重渲染重置中间选择
  }, [open]);

  const dataSource = useMemo(() => Object.values(itemMap), [itemMap]);

  const searchDepts = async (input: string) => {
    const keyword = input.trim();
    const seq = ++deptSearchSeqRef.current;
    if (!keyword) {
      setDeptOptions((prev) =>
        selectedDeptIdRef.current != null
          ? prev.filter((opt) => opt.dept_id === selectedDeptIdRef.current)
          : [],
      );
      return;
    }

    setDeptSearching(true);
    try {
      const res = await retrieveDeptList({
        retrieve_input: keyword,
        retrieve_limit: 50,
      });
      if (seq !== deptSearchSeqRef.current) return;

      const options = (res.dept_list ?? []).filter(
        (dept) => dept.dept_id != null,
      );
      const selectedId = selectedDeptIdRef.current;
      if (
        selectedId != null &&
        !options.some((opt) => opt.dept_id === selectedId)
      ) {
        setDeptOptions((prev) => {
          const selected = prev.find((opt) => opt.dept_id === selectedId);
          return selected ? [selected, ...options] : options;
        });
      } else {
        setDeptOptions(options);
      }
    } catch {
      if (seq !== deptSearchSeqRef.current) return;
    } finally {
      if (seq === deptSearchSeqRef.current) setDeptSearching(false);
    }
  };

  const searchUsersRef = useRef(searchUsers);
  searchUsersRef.current = searchUsers;
  const searchDeptsRef = useRef(searchDepts);
  searchDeptsRef.current = searchDepts;

  const debouncedSearchUsers = useMemo(
    () =>
      debounce((input: string) => {
        void searchUsersRef.current(input);
      }, 300),
    [],
  );
  const debouncedSearchDepts = useMemo(
    () =>
      debounce((input: string) => {
        void searchDeptsRef.current(input);
      }, 300),
    [],
  );

  useEffect(
    () => () => {
      debouncedSearchUsers.cancel();
      debouncedSearchDepts.cancel();
    },
    [debouncedSearchUsers, debouncedSearchDepts],
  );

  const handleNameSearch = (input: string) => {
    setNameKeyword(input);
    nameKeywordRef.current = input;
    debouncedSearchUsers(input);
  };

  const handleDeptSearch = (input: string) => {
    debouncedSearchDepts(input);
  };

  const handleDeptChange = (deptId: number | null) => {
    const nextDeptId = deptId ?? undefined;
    setSelectedDeptId(nextDeptId);
    selectedDeptIdRef.current = nextDeptId;
    void searchUsers(nameKeywordRef.current);
  };

  const handleChange: TransferProps["onChange"] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys as string[]);
  };

  const handleOk = () => {
    const users = targetKeys
      .map((key) => itemMap[key]?.user)
      .filter((user): user is SelectedUser => user != null);
    const dept = deptOptions.find((opt) => opt.dept_id === selectedDeptId) as SelectedDept;
    onOk(users, dept);
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      width={720}
      destroyOnHidden
      okText="确认"
      cancelText="取消"
    >
      <Space style={{ width: LEFT_PANEL_WIDTH, marginBottom: 8 }} size={8}>
        <Select
          allowClear
          showSearch
          value={selectedDeptId}
          options={deptOptions}
          fieldNames={{ label: "dept_name", value: "dept_id" }}
          filterOption={false}
          loading={deptSearching}
          placeholder="科室"
          style={{ width: 120 }}
          onSearch={handleDeptSearch}
          onChange={handleDeptChange}
          notFoundContent={deptSearching ? "搜索中..." : "暂无科室"}
        />
        <Input
          allowClear
          value={nameKeyword}
          placeholder="请输入姓名搜索"
          style={{ width: 144 }}
          onChange={(e) => handleNameSearch(e.target.value)}
        />
      </Space>
      <Transfer
        dataSource={dataSource}
        titles={["待选人员", "已选人员"]}
        targetKeys={targetKeys}
        onChange={handleChange}
        showSearch
        filterOption={() => true}
        render={(item) => item.title}
        listStyle={{ width: LEFT_PANEL_WIDTH, height: 360 }}
        classNames={{
          source: {
            body: "[&>.ant-transfer-list-body-search-wrapper]:!hidden",
          },
          target: {
            body: "[&>.ant-transfer-list-body-search-wrapper]:!hidden",
          },
        }}
        locale={{
          searchPlaceholder: "请输入姓名搜索",
          itemUnit: "人",
          itemsUnit: "人",
          notFoundContent: searching ? "搜索中..." : "暂无数据",
        }}
      />
    </Modal>
  );
};

export default UserMultipleList;
