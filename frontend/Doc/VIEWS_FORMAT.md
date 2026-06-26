# Views Format 

## Schema

## Kanban

The Kanban view consists of 4 areas:
### Header
It has 3 sections where only one field is allowed:
1. image: For avatar or logo, located on the left.

2. title: For the card title.

3. subtitle: Located below the title in smaller font.
### rightColumn
Right column within the Kanban card body. Fields are ordered one below the other, defining their position with an integer index starting from 0.
### leftColumn
Left column within the Kanban card body. Fields are ordered one below the other, defining their position with an integer index starting from 0.
### footer
Fields are ordered in descending order across the width of the Kanban card.

```json
{
    "kanban":{
        "header":"",
        "rightColumn":1,
        "leftColumn":1,
        "footer":1
    }
}
```

## List


## Form

## Calendar

## Insight

