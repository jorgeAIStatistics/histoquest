import { Link } from 'react-router-dom'
import './library.css'

const GROUPS = [
  {
    id: 'read',
    title: 'Read and look things up',
    description: 'Return to a concept or inspect a slide when you need it.',
    resources: [
      { to: '/learn', title: 'Topic lessons', description: 'All lessons, arranged by subject.' },
      {
        to: '/slides',
        title: 'Slide library',
        description: 'Attributed tissue images and schematic artifacts to inspect.',
      },
      {
        to: '/atlas',
        title: 'Reference atlas',
        description: 'Look up fixatives, stains, markers and laboratory concepts.',
      },
    ],
  },
  {
    id: 'lab',
    title: 'Explore the laboratory',
    description:
      'Optional practice tools. The learning path introduces these when they are relevant.',
    resources: [
      {
        to: '/lab3d',
        title: 'Free laboratory',
        description: 'Choose a specimen and explore the 3D or 2D laboratory at your own pace.',
      },
      {
        to: '/career',
        title: 'Practical milestones',
        description: 'Review the seven assessed simulation and planning exercises.',
      },
      {
        to: '/workbench',
        title: 'Specimen workbench',
        description: 'Follow a case through ten connected decisions from receipt to handoff.',
      },
      {
        to: '/lab',
        title: 'Concept simulations',
        description:
          'Short experiments in fixation, processing, sectioning, staining and laboratory math.',
      },
      {
        to: '/shift',
        title: 'Simulated shift',
        description: 'Coordinate multiple cases and review your technical handoffs.',
      },
      {
        to: '/clinic',
        title: 'Troubleshooting clinic',
        description: 'Investigate a failed result, identify its cause and try a correction.',
      },
    ],
  },
  {
    id: 'records',
    title: 'Keep records and plan',
    description: 'Your notes, study routine and supporting information.',
    resources: [
      {
        to: '/notebook',
        title: 'Field notebook',
        description: 'Revisit your chapter notes and specimen workbench history.',
      },
      {
        to: '/today',
        title: 'Daily study plan',
        description: 'Build a daily study routine with review, lessons and practice.',
      },
      {
        to: '/route2',
        title: 'Route 2 tracker',
        description: 'Organize workplace experience records separately from simulation progress.',
      },
      {
        to: '/review',
        title: 'Sources and scientific review',
        description: 'Inspect provenance, model limitations and the qualified-review queue.',
      },
      {
        to: '/settings',
        title: 'Settings and backups',
        description: 'Change display preferences and export or restore your learning records.',
      },
    ],
  },
]

export default function LibraryPage() {
  return (
    <div className="page resource-library">
      <header className="resource-library-intro">
        <h1>Library</h1>
        <p className="lede">All the lessons, tools and references in one place.</p>
        <p>
          For a clear beginning and a step-by-step course,{' '}
          <Link to="/">follow your learning path</Link>. Use this library whenever you want to
          explore or revisit something.
        </p>
      </header>
      <nav className="resource-library-index" aria-label="Library sections">
        {GROUPS.map((group) => (
          <a key={group.id} href={`#library-${group.id}`}>
            {group.title}
          </a>
        ))}
      </nav>
      {GROUPS.map((group) => (
        <section
          key={group.id}
          className="resource-library-group"
          aria-labelledby={`library-${group.id}`}
        >
          <div>
            <h2 id={`library-${group.id}`}>{group.title}</h2>
            <p>{group.description}</p>
          </div>
          <ul>
            {group.resources.map((resource) => (
              <li key={resource.to}>
                <Link to={resource.to}>
                  <strong>{resource.title}</strong>
                  <span>{resource.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
