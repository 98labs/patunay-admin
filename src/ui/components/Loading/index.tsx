const Loading= ({fullScreen = true}) => {
    if (fullScreen) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100 text-base-content">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-lg font-semibold">Loading <span className="loading loading-dots loading-xl"></span></p>
                </div>
            </div>
        );
    }
    return (
        <div className="card bg-base-100 shadow p-6">
            <div className="flex items-center justify-center gap-3">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="text-lg font-semibold">Loading <span className="loading loading-dots loading-xl"></span></p>
            </div>
        </div>
    );
};

export default Loading;