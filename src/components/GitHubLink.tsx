import { GitBranch } from 'lucide-react';

const REPO_URL = 'https://github.com/Th3Un1q3/german-training';

export function GitHubLink() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#9A9A80] hover:bg-[#252525] transition-all"
      title="GitHub"
    >
      <GitBranch size={20} />
    </a>
  );
}
