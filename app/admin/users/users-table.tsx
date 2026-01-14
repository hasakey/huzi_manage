"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EditUserDialog from "./edit-user-dialog";
import RechargeDialog from "./recharge-dialog";
import CreateUserDialog from "./create-user-dialog";
import type { User } from "@/app/admin/actions";

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [rechargingUser, setRechargingUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          共 {users.length} 个用户
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          创建账号
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">邮箱</TableHead>
              <TableHead className="w-[150px]">手机号</TableHead>
              <TableHead className="w-[150px]">姓名</TableHead>
              <TableHead className="w-[100px]">角色</TableHead>
              <TableHead className="w-[150px]">余额</TableHead>
              <TableHead className="w-[180px]">注册时间</TableHead>
              <TableHead className="w-[200px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  暂无用户数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.email || user.id.slice(0, 8) + "..."}
                  </TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className={
                        user.role === "admin"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }
                    >
                      {user.role === "admin" ? "管理员" : "用户"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ¥{user.balance.toLocaleString("zh-CN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setRechargingUser(user)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        充值
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={handleUpdate}
        />
      )}

      {rechargingUser && (
        <RechargeDialog
          user={rechargingUser}
          open={!!rechargingUser}
          onOpenChange={(open) => !open && setRechargingUser(null)}
          onSuccess={handleUpdate}
        />
      )}

      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleUpdate}
      />
    </>
  );
}
