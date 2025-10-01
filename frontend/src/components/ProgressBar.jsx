const ProgressBar = ({ completed, total }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
      <div
        className="bg-blue-600 h-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-500"
        style={{ width: `${percentage}%` }}
      >
        {percentage > 10 && `${completed} / ${total}`}
      </div>
      {percentage <= 10 && (
        <div className="text-center text-sm font-semibold text-gray-700 -mt-6">
          {completed} / {total}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
