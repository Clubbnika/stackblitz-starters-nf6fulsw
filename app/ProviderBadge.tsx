const ProviderBadge = ({ provider }: { provider: string }) => {
    const isGudFud = provider === 'GUD FUD';
    return (
      <span className={`px-2 py-0.5 text-[8px] font-black uppercase border-2 ${
        isGudFud 
          ? 'border-black bg-yellow-300' 
          : 'border-black bg-cyan-300'
      }`}>
        {provider}
      </span>
    );
  };