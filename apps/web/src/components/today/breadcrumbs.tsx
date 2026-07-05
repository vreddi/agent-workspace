import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@org/ui/components/breadcrumb'
import { Link, type LinkProps } from '@tanstack/react-router'
import { Fragment } from 'react'

export type AppCrumb = {
  label: string
  /** Omit on the current page (the last crumb, rendered as plain text). */
  to?: LinkProps['to']
  params?: LinkProps['params']
}

/**
 * Themed breadcrumb trail for detail pages: quiet links back up the
 * hierarchy, ending with the current page. Top-level pages (Today, Goals,
 * Day view, Agents) don't render one — the nav already marks where you are.
 *
 * Styled by `.t-crumbs` in today/styles.ts, so it needs the app shell.
 */
export function AppBreadcrumbs({ items }: { items: AppCrumb[] }) {
  return (
    <Breadcrumb className="t-crumbs">
      <BreadcrumbList>
        {items.map((item, idx) => {
          const last = idx === items.length - 1
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <BreadcrumbItem>
                {item.to && !last ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.to} params={item.params}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
