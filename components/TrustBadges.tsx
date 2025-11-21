import { RoleTag } from '@/lib/models'

interface TrustBadgesProps {
  byRole: Partial<Record<RoleTag, number>>
}

export function TrustBadges({ byRole }: TrustBadgesProps) {
  const roleOrder: RoleTag[] = ['Investor', 'Employee', 'Founder', 'Customer', 'Advisor', 'Fan']
  
  const roleColors = {
    Investor: 'bg-purple-100 text-purple-800 border-purple-200',
    Employee: 'bg-blue-100 text-blue-800 border-blue-200',
    Founder: 'bg-green-100 text-green-800 border-green-200',
    Customer: 'bg-orange-100 text-orange-800 border-orange-200',
    Advisor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Fan: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="flex flex-wrap gap-2">
      {roleOrder.map(role => {
        const count = byRole[role] || 0
        if (count === 0) return null
        
        return (
          <div
            key={role}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleColors[role]}`}
          >
            <span className="font-semibold">{count}</span>
            <span className="ml-1 opacity-75">{role}{count > 1 ? 's' : ''}</span>
          </div>
        )
      })}
    </div>
  )
}