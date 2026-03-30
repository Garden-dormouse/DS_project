```mermaid
package "Frontend" {
  [React App]
  [API Service]
}

package "Backend" {
  package "API Layer" {
    [Flask Routes]
  }
  
  package "Service Layer" {
    [PageviewService]
    [LanguageService]
    [TimestampService]
    [SpeciesService]
  }
  
  package "Data Access Layer" {
    [PageviewDAO]
    [LanguageDAO]
    [TimestampDAO]
    [SpeciesDAO]
  }
}

package "Database" {
  [PostgreSQL]
}

[React App] --> [API Service] : HTTP/JSON
[API Service] --> [Flask Routes] : fetch()
[Flask Routes] --> [PageviewService]
[Flask Routes] --> [LanguageService]
[Flask Routes] --> [TimestampService]
[Flask Routes] --> [SpeciesService]
[PageviewService] --> [PageviewDAO]
[LanguageService] --> [LanguageDAO]
[TimestampService] --> [TimestampDAO]
[SpeciesService] --> [SpeciesDAO]
[PageviewDAO] --> [PostgreSQL]
[LanguageDAO] --> [PostgreSQL]
[TimestampDAO] --> [PostgreSQL]
[SpeciesDAO] --> [PostgreSQL]
```
