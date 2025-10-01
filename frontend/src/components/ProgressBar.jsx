const ProgressBar = ({ completed, total }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="w-full bg-white/10 backdrop-blur-sm rounded-full h-8 overflow-hidden border border-white/20 shadow-inner">
      <div
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-full flex items-center justify-center text-white text-sm font-bold transition-all duration-500 shadow-lg"
        style={{ width: `${percentage}%` }}
      >
        {percentage > 15 && `${completed} / ${total}`}
      </div>
      {percentage <= 15 && (
        <div className="text-center text-sm font-bold text-white -mt-8 drop-shadow-lg">
          {completed} / {total}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
