'use client';
import { useState, useMemo } from 'react';
import Shell from '@/components/Shell';
import {
  BookOpen,
  Search,
  ExternalLink,
  FileText,
  Code,
  Download,
  Filter,
  Layers,
  Sparkles,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

interface AcademicResource {
  id: string;
  courseCode: string;
  courseTitle: string;
  category: 'Programming' | 'Mathematics' | 'Databases' | 'Networking' | 'Professional';
  type: 'Syllabus' | 'Lecture Notes' | 'Past Paper' | 'Documentation' | 'Code Practice';
  title: string;
  description: string;
  url: string;
}

const ACADEMIC_RESOURCES: AcademicResource[] = [
  {
    id: '1',
    courseCode: 'DIT111',
    courseTitle: 'Computer Programming',
    category: 'Programming',
    type: 'Documentation',
    title: 'Modern TypeScript & JavaScript Reference',
    description: 'Complete documentation for ESNext, async programming, data structures, and typed programming.',
    url: 'https://www.typescriptlang.org/docs/',
  },
  {
    id: '2',
    courseCode: 'DAA112',
    courseTitle: 'Mathematics for IT',
    category: 'Mathematics',
    type: 'Lecture Notes',
    title: 'Discrete Mathematics & Boolean Logic Guide',
    description: 'Foundations of set theory, propositional logic, matrices, and graph theory for computing students.',
    url: 'https://en.wikipedia.org/wiki/Discrete_mathematics',
  },
  {
    id: '3',
    courseCode: 'DIS212',
    courseTitle: 'Database Systems 1',
    category: 'Databases',
    type: 'Code Practice',
    title: 'PostgreSQL Relational SQL Tutorial',
    description: 'Interactive reference on normalization (1NF, 2NF, 3NF), relational algebra, and PostgreSQL indexing.',
    url: 'https://www.postgresql.org/docs/',
  },
  {
    id: '4',
    courseCode: 'DIS211',
    courseTitle: 'Web Design',
    category: 'Programming',
    type: 'Documentation',
    title: 'MDN Web Technology Guidelines',
    description: 'Official HTML5 semantic elements, responsive CSS grid/flexbox, accessibility (WCAG), and client scripting.',
    url: 'https://developer.mozilla.org/',
  },
  {
    id: '5',
    courseCode: 'DIT211',
    courseTitle: 'Computer Networking 1',
    category: 'Networking',
    type: 'Lecture Notes',
    title: 'OSI 7-Layer & TCP/IP Architecture Notes',
    description: 'Packet switching, IPv4/IPv6 addressing, subnet masking, routing protocols, and Ethernet topologies.',
    url: 'https://en.wikipedia.org/wiki/OSI_model',
  },
  {
    id: '6',
    courseCode: 'DIT313',
    courseTitle: 'Cybersecurity Essentials',
    category: 'Networking',
    type: 'Past Paper',
    title: 'Network Security & Cryptography Study Sheet',
    description: 'Symmetric and asymmetric encryption, hashing (SHA-256), PKI certificates, firewalls, and threat modeling.',
    url: 'https://owasp.org/www-project-top-ten/',
  },
  {
    id: '7',
    courseCode: 'DSD321',
    courseTitle: 'Research Methods',
    category: 'Professional',
    type: 'Syllabus',
    title: 'Academic Research & Literature Methodology',
    description: 'Research design, quantitative/qualitative data analysis, citation standards (APA/IEEE), and ethics.',
    url: 'https://www.ieee.org/',
  },
  {
    id: '8',
    courseCode: 'DIS213',
    courseTitle: 'Data Structures & Algorithms',
    category: 'Programming',
    type: 'Code Practice',
    title: 'Algorithms & Big-O Complexity Visualizer',
    description: 'Linked lists, binary trees, sorting algorithms, dynamic programming, and space-time complexity.',
    url: 'https://visualgo.net/',
  },
];

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(['1', '3']));

  const categories = ['All', 'Programming', 'Mathematics', 'Databases', 'Networking', 'Professional'];

  const filtered = useMemo(() => {
    return ACADEMIC_RESOURCES.filter((res) => {
      const matchCat = selectedCategory === 'All' || res.category === selectedCategory;
      const q = search.toLowerCase();
      const matchQuery =
        !q ||
        res.courseCode.toLowerCase().includes(q) ||
        res.courseTitle.toLowerCase().includes(q) ||
        res.title.toLowerCase().includes(q) ||
        res.type.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [search, selectedCategory]);

  function toggleBookmark(id: string) {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Shell signedIn>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill">Learning & Curriculum Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Learning Resources
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Approved reference manuals, lecture notes, documentation, and practice materials for IPAM degree programmes.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search resources by course code (e.g. DIT111), title, or type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[11px] mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => {
            const isBookmarked = bookmarkedIds.has(item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded text-xs border border-blue-200">
                        {item.courseCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBookmarked
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-300 hover:text-slate-500'
                      }`}
                      title={isBookmarked ? 'Bookmarked' : 'Bookmark resource'}
                    >
                      <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{item.title}</h3>
                  <p className="text-xs font-medium text-slate-500 mb-2">{item.courseTitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Open Resource
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching learning resources found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or category filter.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
