import {
  CardDescription,
  CardHeader,
  CardTitle,
  Card,
  CardContent,
} from "@/components/ui/card";
import db from "@/db/db";
import { formatCurrency, formatNumber } from "@/lib/formatters";

async function getSalesData() {
  const data = await db.order.aggregate({
    _sum: { pricePaidInCents: true },
    _count: true,
  });
  return {
    amount: formatCurrency((data._sum.pricePaidInCents || 0) / 100),
    numberOfSales: formatNumber(data._count),
  };
}

async function getUserData() {
  const [userCount, orderData] = await Promise.all([
    db.user.count(),
    db.order.aggregate({
      _sum: { pricePaidInCents: true },
    }),
  ]);
  return {
    userCount,
    averageValuePerUser:
      userCount === 0
        ? 0
        : (orderData._sum.pricePaidInCents || 0 / userCount) / 100,
  };
}

async function getActiveProducts() {
  const [activeProductCount, inactiveProductCount] = await Promise.all([
    db.product.count({
      where: { isAvailableForPurchase: true },
    }),
    db.product.count({
      where: { isAvailableForPurchase: false },
    }),
  ]);

  return {
    activeProductCount,
    inactiveProductCount,
  };
}

export default async function AdminDashboard() {
  const [salesData, userData, productData] = await Promise.all([
    getSalesData(),
    getUserData(),
    getActiveProducts(),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard
        title="Sales"
        subtitle={`${salesData.numberOfSales} Orders`}
        body={salesData.amount}
      />
      <DashboardCard
        title="Customers"
        subtitle={`${formatCurrency(
          userData.averageValuePerUser
        )} Average value`}
        body={formatNumber(userData.userCount)}
      />
      <DashboardCard
        title="Active Products"
        subtitle={`${formatNumber(productData.inactiveProductCount)} Inactive`}
        body={formatNumber(productData.activeProductCount)}
      />
    </div>
  );
}

type DashboardCardProps = {
  title: String;
  subtitle: String;
  body: String;
};

function DashboardCard({ title, subtitle, body }: DashboardCardProps) {
  return (
    <Card className="hover:bg-slate-100 hover:ease-in duration-200">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
    </Card>
  );
}
