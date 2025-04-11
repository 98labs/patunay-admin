const UserProfile = () => {
  return (
    <div className="px-4 py-8">
      <div className="flex items-center gap-2">
        <img
          src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Profile Pic"
          className="rounded-full w-12 h-12 object-cover object-top"
        />
        <div className="my-auto">
          <div className="text-base font-semibold">Fundacion Sanso</div>
          <div className="text-xs">Head Office</div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
