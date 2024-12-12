select distinct
    csm.menu_id,
    csm.id as sub_menu_id,
    name,
    icon,
    FSM.created_at as favorite_at
    from "ChatSubMenus" csm
left join public."FavoriteSubMenus" FSM on csm.id = FSM.sub_menu_id
left join public."ChatRooms" CR on csm.id = CR.sub_menu_id
    where FSM.user_id = '550e8400-e29b-41d4-a716-446655442222' and
    ((
         cr.initiator = '550e8400-e29b-41d4-a716-446655442222' and
         cr.initiator_role = 'buyer' and
         cr.recipient_role = 'seller'
         ) or
     (
         cr.recipient = '550e8400-e29b-41d4-a716-446655442222' and
         cr.recipient_role = 'buyer' and
         cr.initiator_role = 'seller'
         )) and
    FSM.view_as = 'seller'
order by FSM.created_at desc;