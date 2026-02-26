import React, { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Table,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useWorkflow } from "../store/WorkflowContext";
import { reportService } from "../services/api";

interface ReportViewerProps {
  reportId?: string | null;
  reportUrl?: string | null;
  reportFileName?: string;
  onGoBack?: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  reportId: propReportId,
  reportUrl: propReportUrl,
  reportFileName: propReportFileName,
  onGoBack,
}) => {
  const { config } = useWorkflow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportMeta, setReportMeta] = useState<any>(null);

  const reportId = propReportId || config.reportId;
  const reportUrl = propReportUrl || config.reportUrl;
  const reportFileName =
    propReportFileName || config.reportFileName || "report.xlsx";

  useEffect(() => {
    console.log("🔍 ReportViewer mounted/updated");
    console.log("  - reportId:", reportId);
    console.log("  - reportUrl:", reportUrl);
    console.log("  - reportFileName:", reportFileName);

    if (reportId) {
      console.log("✅ Report ID found, loading data...");
      loadReportData();
    } else {
      console.log("⚠️ No report ID provided");
    }
  }, [reportId]);

  const loadReportData = async () => {
    if (!reportId) return;

    setLoading(true);
    setError(null);

    try {
      console.log("📊 Loading report data for ID:", reportId);
      const response = await reportService.getReport(reportId);

      if (response.data?.status === "success" && response.data.report) {
        const report = response.data.report;
        setReportMeta({
          report_id: report.report_id,
          report_type: report.report_type,
          report_title: report.report_title,
          generated_at: report.generated_at,
          status: report.status,
        });
        setReportData(report.report_data);
        console.log("✅ Report data loaded:", report.report_data);
      }
    } catch (err: any) {
      console.error("❌ Failed to load report:", err);
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (reportUrl) {
      window.open(reportUrl, "_blank");
    }
  };

  // Render different dashboard layouts based on report type
  const renderDashboard = () => {
    if (!reportData) return null;

    const reportType = reportMeta?.report_type?.toLowerCase() || "";

    // AP Aging Report Dashboard
    if (reportType.includes("aging")) {
      return <AgingReportDashboard data={reportData} meta={reportMeta} />;
    }

    // AP/AR Register Dashboard
    if (reportType.includes("register")) {
      return <RegisterDashboard data={reportData} meta={reportMeta} />;
    }

    // DSO Dashboard
    if (reportType.includes("dso")) {
      return <DSODashboard data={reportData} meta={reportMeta} />;
    }

    // Generic Table Dashboard (fallback)
    return <GenericTableDashboard data={reportData} meta={reportMeta} />;
  };

  if (!reportId && !reportUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-gray-700 shadow-xl">
            <FileText className="w-12 h-12 text-blue-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-100">
              No Report Generated Yet
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Run a workflow query to generate a report. Once complete, it will
              appear here with an interactive dashboard.
            </p>
          </div>
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-blue-500/30"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Workflow
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
          <p className="text-gray-400">Loading report dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-2xl flex items-center justify-center border border-red-700 shadow-xl">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-100">
              Error Loading Report
            </h3>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">
                {reportMeta?.report_title || "Report Dashboard"}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {reportMeta?.generated_at
                  ? new Date(reportMeta.generated_at).toLocaleString()
                  : reportFileName}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {reportUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-green-500/30"
              >
                <Download className="w-4 h-4" />
                Download Excel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-6">{renderDashboard()}</div>
    </div>
  );
};

// Aging Report Dashboard Component
const AgingReportDashboard: React.FC<{ data: any; meta: any }> = ({
  data,
  meta,
}) => {
  const summary = data?.summary || {};
  const aging_buckets = data?.aging_buckets || [];
  const invoices = data?.invoices || data?.data || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Outstanding"
          value={`₹${(summary.total_outstanding || 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Total Invoices"
          value={(summary.total_invoices || invoices.length).toString()}
          icon={<FileText className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Overdue Amount"
          value={`₹${(summary.overdue_amount || 0).toLocaleString()}`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Avg Days Outstanding"
          value={`${Math.round(summary.average_days || 0)} days`}
          icon={<Clock className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Aging Buckets */}
      {aging_buckets.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-400" />
            Aging Buckets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {aging_buckets.map((bucket: any, idx: number) => (
              <div
                key={idx}
                className="bg-gray-900/50 border border-gray-700 rounded-xl p-4"
              >
                <p className="text-xs text-gray-400 mb-1">
                  {bucket.bucket || bucket.range}
                </p>
                <p className="text-2xl font-bold text-gray-100">
                  ₹{(bucket.amount || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {bucket.count || 0} invoices
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {invoices.length > 0 && (
        <DataTable
          title="Invoice Details"
          data={invoices}
          columns={[
            { key: "invoice_number", label: "Invoice #" },
            { key: "vendor_name", label: "Vendor" },
            { key: "invoice_date", label: "Date", format: "date" },
            { key: "due_date", label: "Due Date", format: "date" },
            { key: "amount", label: "Amount", format: "currency" },
            { key: "outstanding", label: "Outstanding", format: "currency" },
            { key: "days_outstanding", label: "Days", format: "number" },
            { key: "aging_bucket", label: "Bucket" },
          ]}
        />
      )}
    </div>
  );
};

// Register Dashboard Component
const RegisterDashboard: React.FC<{ data: any; meta: any }> = ({
  data,
  meta,
}) => {
  const summary = data?.summary || {};
  const invoices = data?.invoices || data?.data || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoices"
          value={invoices.length.toString()}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Total Amount"
          value={`₹${(summary.total_amount || 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Paid Amount"
          value={`₹${(summary.paid_amount || 0).toLocaleString()}`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Outstanding"
          value={`₹${(summary.outstanding || 0).toLocaleString()}`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Invoices Table */}
      {invoices.length > 0 && (
        <DataTable
          title="Invoice Register"
          data={invoices}
          columns={[
            { key: "invoice_number", label: "Invoice #" },
            { key: "vendor_name", label: "Vendor/Customer" },
            { key: "invoice_date", label: "Date", format: "date" },
            { key: "amount", label: "Amount", format: "currency" },
            { key: "tax", label: "Tax", format: "currency" },
            { key: "total", label: "Total", format: "currency" },
            { key: "paid", label: "Paid", format: "currency" },
            { key: "outstanding", label: "Outstanding", format: "currency" },
            { key: "status", label: "Status" },
          ]}
        />
      )}
    </div>
  );
};

// DSO Dashboard Component
const DSODashboard: React.FC<{ data: any; meta: any }> = ({ data, meta }) => {
  const dso = data?.dso || data?.days_sales_outstanding || 0;
  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* DSO Metric */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl text-center">
        <p className="text-white/80 text-sm font-medium mb-2">
          Days Sales Outstanding
        </p>
        <p className="text-6xl font-bold text-white mb-2">{Math.round(dso)}</p>
        <p className="text-white/60 text-sm">days</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Receivables"
          value={`₹${(summary.total_receivables || 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Total Sales"
          value={`₹${(summary.total_sales || 0).toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Collection Efficiency"
          value={`${Math.round(summary.collection_efficiency || 0)}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          color="purple"
        />
      </div>
    </div>
  );
};

// Generic Table Dashboard (fallback)
const GenericTableDashboard: React.FC<{ data: any; meta: any }> = ({
  data,
  meta,
}) => {
  const dataArray = Array.isArray(data)
    ? data
    : data?.data || data?.invoices || [];

  if (dataArray.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-12 text-center">
        <FileSpreadsheet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No data available to display</p>
      </div>
    );
  }

  const columns = Object.keys(dataArray[0]).map((key) => ({
    key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return <DataTable title="Report Data" data={dataArray} columns={columns} />;
};

// Reusable Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "red" | "orange" | "emerald";
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "from-blue-600 to-blue-700",
    green: "from-green-600 to-green-700",
    purple: "from-purple-600 to-purple-700",
    red: "from-red-600 to-red-700",
    orange: "from-orange-600 to-orange-700",
    emerald: "from-emerald-600 to-emerald-700",
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <div
          className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  );
};

// Reusable Data Table Component
const DataTable: React.FC<{
  title: string;
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    format?: "currency" | "date" | "number";
  }>;
}> = ({ title, data, columns }) => {
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return "-";

    if (format === "currency") {
      return `₹${Number(value).toLocaleString()}`;
    }
    if (format === "date") {
      return new Date(value).toLocaleDateString();
    }
    if (format === "number") {
      return Number(value).toLocaleString();
    }
    return String(value);
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4">
        <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <Table className="w-5 h-5 text-blue-400" />
          {title}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{data.length} records</p>
      </div>

      <div className="overflow-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-800 border-b-2 border-gray-700">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-gray-800/50 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-6 py-4 text-gray-300 whitespace-nowrap"
                  >
                    {formatValue(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
