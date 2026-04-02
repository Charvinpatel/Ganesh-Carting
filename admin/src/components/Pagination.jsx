import { Pagination as AntPagination } from 'antd';

export default function Pagination({ page, totalPages, total, onPageChange, limit = 10 }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4 bg-surface-900/50 border-t border-surface-800 rounded-b-xl">
      <div className="hidden sm:block">
        <p className="text-xs text-surface-500 uppercase tracking-widest font-bold">
          Showing <span className="text-white">{(page - 1) * limit + 1}</span> to{' '}
          <span className="text-white">{Math.min(page * limit, total)}</span> of{' '}
          <span className="text-white">{total}</span>
        </p>
      </div>
      <div className="flex-1 sm:flex-initial">
        <AntPagination
          current={page}
          total={total}
          pageSize={limit}
          onChange={onPageChange}
          showSizeChanger={false}
          size="small"
        />
      </div>
    </div>
  );
}
