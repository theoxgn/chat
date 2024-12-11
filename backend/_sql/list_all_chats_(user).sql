
select
    cr.id as id,
    initiator.id as initiator_id,
    initiator.username as initiator_username,
    cr.initiator_role as initiator_role,
    recipient.id as recipient_id,
    recipient.username as recipient_username,
    cr.recipient_role as recipient_role,
    PC.created_at as pinned_at,
    json_build_object(
            'messages', json_agg(
                json_build_object(
                        'last_message_content', M.content,
                        'last_message_created_at', M.created_at,
                        'last_message_type', M.message_type,
                        'last_message_status', M.status,
                        'menu_name', CM.name,
                        'sub_menu_name', CSM.name
                )
            )
    ) as messages,
    (
        SELECT COUNT(*)
        FROM public."Messages" unread
        WHERE unread.chat_room_id = cr.id
          AND unread.status = 'delivered'
    ) as unread_count

from "ChatRooms" cr
         left join public."Users" initiator on cr.initiator = initiator.id
         left join public."Users" recipient on cr.recipient = recipient.id
         left join (
    select distinct on (chat_room_id) *
    from public."Messages"
    order by chat_room_id, created_at desc
) M on cr.id = M.chat_room_id
         left join public."PinnedChat" PC on cr.id = PC.chat_room_id
         left join public."ChatSubMenus" CSM on cr.sub_menu_id = CSM.id
         left join public."ChatMenus" CM on CSM.menu_id = CM.id
where
    ((
         cr.initiator = '550e8400-e29b-41d4-a716-446655442222' and
         cr.initiator_role = 'buyer' and
         cr.recipient_role = 'seller'
         ) or
     (
         cr.recipient = '550e8400-e29b-41d4-a716-446655442222' and
         cr.recipient_role = 'buyer' and
         cr.initiator_role = 'seller'
         ))
  and cr.sub_menu_id = 'f482b827-3a76-4052-9545-e124bb48fdf8'
  and M.created_at is not null
--     and M.status = 'delivered'
group by
    cr.id,
    initiator.id,
    initiator.username,
    cr.initiator_role,
    recipient.id,
    recipient.username,
    cr.recipient_role,
    PC.created_at,
    M.created_at
order by
    PC.created_at desc nulls last,
    M.created_at desc nulls last
limit 10
    offset 0;
