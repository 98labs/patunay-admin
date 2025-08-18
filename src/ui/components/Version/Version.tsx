const Version = () => {
  const version = import.meta.env.VITE_APP_VERSION || '1.0.15';

  return (
    <div className="fixed bottom-0 left-1 rounded text-[10px] text-gray-500 shadow-sm select-none">
      {`v${version}`}
    </div>
  );
};

export default Version;
