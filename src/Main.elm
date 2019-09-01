module Main exposing (Model)

import Browser
import Browser.Events
import Html exposing (..)
import Html.Attributes exposing (class, src)
import Html.Events exposing (..)
import Json.Decode as Decode
import Types exposing (KeyValue)
import Util


main : Program () Model Msg
main =
    Browser.element { init = init, update = update, view = view, subscriptions = subscriptions }



-- MODEL


type Hist
    = Help String
    | Name String
    | Icon String
    | Error String


type alias Model =
    { current : String
    , hists : List Hist
    }


type Msg
    = Type KeyValue


init : () -> ( Model, Cmd Msg )
init _ =
    ( { current = "help"
      , hists = []
      }
    , Cmd.none
    )



-- UPDATE


decode : String -> Hist
decode acc =
    case acc of
        "help" ->
            Help "help"

        "name" ->
            Name "name"

        "icon" ->
            Icon "icon"

        err ->
            Error err


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Type (Types.Character c) ->
            ( { model | current = model.current ++ String.fromChar c }, Cmd.none )

        Type (Types.Control "Enter") ->
            ( { model | current = "", hists = decode model.current :: model.hists }, Cmd.none )

        Type (Types.Control "Backspace") ->
            ( { model | current = String.left (String.length model.current - 1) model.current }, Cmd.none )

        Type (Types.Control _) ->
            ( model, Cmd.none )



-- VIEW


renderPrompt =
    span [] [ span [ class "arrow" ] [ text "×> " ], span [ class "dir" ] [ text "~/ " ] ]


renderCurrent s =
    let
        candidates =
            [ "name", "help", "icon" ]
    in
    if s == "" then
        span [] [ text "" ]

    else if candidates |> List.any (\candidate -> candidate == s) then
        span [ class "exact" ] [ text s ]

    else
        let
            currentLen =
                String.length s
        in
        case candidates |> List.filter (\candidate -> s == String.left currentLen candidate) |> List.head of
            Just candidate ->
                span []
                    [ span [ class "error" ] [ text s ]
                    , span [ class "yet" ] [ text (String.right (String.length candidate - currentLen) candidate) ]
                    ]

            Nothing ->
                span [ class "error" ] [ text s ]


renderHists hists =
    List.map
        (\hist ->
            case hist of
                Help s ->
                    div []
                        [ div [] [ renderPrompt, text s ]
                        , div [] [ renderPrompt, text "type \"name\" or \"icon\"" ]
                        ]

                Name s ->
                    div []
                        [ div [] [ renderPrompt, text s ]
                        , div [] [ renderPrompt, text "Nakano Masaki" ]
                        ]

                Icon s ->
                    div []
                        [ div [] [ renderPrompt, text s ]
                        , img [ src "./res/icon.jpg" ] [ renderPrompt ]
                        ]

                Error s ->
                    div [ class "error" ] [ renderPrompt, text s ]
        )
        hists


view : Model -> Html Msg
view model =
    let
        lists =
            div [] [ renderPrompt, renderCurrent model.current ] :: renderHists model.hists
    in
    div [] (List.reverse lists)



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Browser.Events.onKeyDown (Decode.map Type Util.keyDecoder)
        ]
